require('dotenv').config();

const { 
    generateHashedAndEncryptedPassword, 
    decryptHashedPassword, 
    generateRSAKeys, 
    encryptPrivateKey,
    generateAESKey,
    encryptAESKeyWithPublicKey,
    encrypt
    } = require('./encryption.js');
const { send_mail, send_otp } = require('./email.js');

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt'); 

const app = express();
app.use(express.json());

const allowedOrigins = [
    "https://h-engine.vercel.app", // PRODUCTION FRONTEND
    "https://h-engine-dev.vercel.app", // PRODUCTION DEV FRONTEND
    "http://localhost:3000", // LOCAL DEVELOPMENT
    "https://h-engine-10april-newer.vercel.app"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", 'user_id'],
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    const origin = req.get("origin");
    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({ message: "Forbidden: Unauthorized Origin" });
    }
    next();
});

const dbConfig = {
    user: process.env.DATABASE_LOGIN_USERNAME,
    password: process.env.DATABASE_LOGIN_PASSWORD,
    server: process.env.DATABASE_URL,
    database: process.env.DATABASE_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const postgisPool = new Pool({
    host: process.env.PG_DB_HOST, 
    user: process.env.PG_DB_USER,
    password: process.env.PG_DB_PASSWORD, 
    database: process.env.PG_DB_NAME, 
    port: process.env.PG_DB_PORT, 
    ssl: {
        rejectUnauthorized: false 
    }
});

postgisPool.query('SELECT NOW()')
    .then(res => {
    console.log('PostGIS connection successful:', res.rows[0]);
    })
    .catch(err => {
    console.error('PostGIS connection error:', err);
});

sql.connect(dbConfig)
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection failed:', err));

// MIDDLEWARE TO ENCRYPT ALL RESPONSES
app.use(async (req, res, next) => {

    console.log('-'.repeat(50));

    if (req.originalUrl === '/api/login' || req.originalUrl === '/api/logout') {
        return next(); 
    }

    const userId = req.headers['user_id']; 
    console.log(`FETCHING ROUTE ${req.originalUrl} FOR USER ${userId}`);

    if (!userId) {
        return res.status(400).json({ error: "Missing user_id in request" });
    }

    try {
        const result = await sql.query`SELECT ACCESS_KEY FROM ACCESS_KEYS WHERE USER_ID = CONVERT(UNIQUEIDENTIFIER, ${userId})`;

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "No encryption key found for user" });
        }

        const aesKey = result.recordset[0].ACCESS_KEY;
        res.locals.aesKey = aesKey; 

        console.log(`Fetched AES key for user ${userId}`);
        console.log('')

        const originalSend = res.send.bind(res);
        res.send = (data) => {
            console.log(`Encrypting response for ${req.method} ${req.originalUrl}`);
            console.log('')
            
            if (typeof data !== 'string') {
                data = JSON.stringify(data);
            }

            const encryptedData = encrypt(data, aesKey);
            originalSend(encryptedData);
        };

        next();

        
    } catch (error) {
        console.error("Error fetching AES key:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
    
    console.log('-'.repeat(50));
});

// ------------------- USER ROUTES START HERE -------------------

// ROUTE TO GET ALL USERS
app.get('/api/get-all-users', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM USERS`;
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO LOGIN A USER
app.post('/api/login', async (req, res) => {
    const { email, password, login_location } = req.body;

    console.log(email, password, login_location);

    try {
        console.log(`USER WITH EMAIL ${email} TRYING TO LOGIN`);
        const userResult = await sql.query`SELECT * FROM USERS WHERE EMAIL = ${email}`;

        if (userResult.recordset.length === 0) {
            console.log('User with this email does not exist');
            return res.status(404).json({ error: 'User with this email does not exist' });
        }

        const user = userResult.recordset[0];

        const hashedAndEncryptedPassword = user.HASHED_AND_ENCRYPTED_PASSWORD;
        const created_at = user.CREATED_AT.toISOString().slice(0, 19).replace('T', ' ');
        const decrypted = decryptHashedPassword(hashedAndEncryptedPassword, created_at);

        const isPasswordCorrect = await bcrypt.compare(password, decrypted);
    
        if (!isPasswordCorrect) {
            console.log('Incorrect password');
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const { HASHED_AND_ENCRYPTED_PASSWORD, ...userWithoutPassword } = user;
        console.log('User logged in successfully');

        const { publicKey, privateKey } = generateRSAKeys(); 

        const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

        const user_id = user.USER_ID;
        const access_key = generateAESKey()
        const encryptedAccessKey = encryptAESKeyWithPublicKey(access_key, publicKey);
        
        try {
            const result = await sql.query`
                INSERT INTO ACCESS_KEYS (USER_ID, ACCESS_KEY, RSA_PUBLIC_KEY, ROTATED_ON)
                OUTPUT INSERTED.USER_ID
                VALUES (${user_id}, ${access_key}, ${publicKey}, GETDATE());
            `;
            
            console.log(`Access key inserted for user ID: ${user_id}`);
        
        } catch (error) {
            console.error('Database query error:', error.message);
        
            let errorMessage = 'An unknown error occurred';
            let statusCode = 500;
        
            if (error.code) {
                switch (error.number) {
                    case 2627:
                    case 2601: 
                        errorMessage = `There is an active session for this user. Please logout first.`;
                        statusCode = 409; 
                        break;
                    default:
                        errorMessage = `Database error: ${error.sqlMessage || error.message}`;
                        break;
                }
            } else {
                errorMessage = error.message;
            }
        
            return res.status(statusCode).json({ error: errorMessage });
        }

        const last_logged_in = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await sql.query`UPDATE USERS SET LAST_LOGIN = ${last_logged_in}, LAST_LOGIN_LOCATION = ${login_location} WHERE EMAIL = ${email}`;

        return res.status(200).json({...userWithoutPassword, ENCRYPTION_KEYS: {...encryptedPrivateKey, accessKey: encryptedAccessKey}});
        
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO LOGOUT A USER
app.post('/api/logout', async (req, res) => {
    const { user_id } = req.body;
    console.log(`USER WITH ID ${user_id} TRYING TO LOGOUT`);
    try {
        const result = await sql.query`
            DELETE FROM ACCESS_KEYS WHERE USER_ID = CONVERT(UNIQUEIDENTIFIER, ${user_id})
        `;
        if (result.rowsAffected === 0) {
            console.log('No access key found for this user');
            return res.status(404).json({ error: 'No access key found for this user' });
        }
        console.log('User logged out successfully');
        return res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO SEND AN OTP
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    
    try {
        console.log(`USER WITH EMAIL ${email} TRYING TO SEND OTP`);
        const userResult = await sql.query`SELECT * FROM USERS WHERE EMAIL = ${email}`;
        
        if (userResult.recordset.length === 0) {
            console.log('User with this email does not exist');
            return res.status(404).json({ error: 'User with this email does not exist' });
        }

        const otp = await send_otp(email);
        console.log(`OTP sent to ${email} successfully`);
        return res.status(200).json({ message: 'OTP sent successfully', otp });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO GET A USER BY UUID
app.post('/api/get-user-email-and-status', async (req, res) => {
    const { uuid } = req.body; 

    try {
        const result = await sql.query`SELECT EMAIL, STATUS FROM USERS WHERE USER_ID = ${uuid}`;
        const user = result.recordset[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User email fetched successfully');
        return res.status(200).json({ EMAIL: user.EMAIL, STATUS: user.STATUS });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO REGISTER A USER
app.post('/api/add-user', async (req, res) => {
    const { email, display_name, first_name, last_name, company, role, created_by } = req.body;

    try {
        const existingUser = await sql.query`
            SELECT USER_ID FROM USERS WHERE EMAIL = ${email}
        `;

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
        }

        const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const hashedAndEncryptedPassword = await generateHashedAndEncryptedPassword(email, created_at);

        const result = await sql.query`
            INSERT INTO USERS (EMAIL, DISPLAY_NAME, FIRST_NAME, LAST_NAME, COMPANY, ROLE, CREATED_BY, CREATED_AT, HASHED_AND_ENCRYPTED_PASSWORD)
            OUTPUT INSERTED.USER_ID
            VALUES (${email}, ${display_name}, ${first_name}, ${last_name}, ${company}, ${role}, ${created_by}, ${created_at}, ${hashedAndEncryptedPassword})
        `;

        const UUID = result.recordset[0].USER_ID;

        console.log(`User with data:
            email = ${email},
            display_name = ${display_name},
            first_name = ${first_name},
            last_name = ${last_name},
            company = ${company},
            role = ${role},
            created_by = ${created_by},
            created_at = ${created_at}
            
            registered successfully`);

        send_mail(UUID, email, 'complete-signup');

        return res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO CHANGE PASSWORD
app.put('/api/change-password', async (req, res) => {
    const { email, new_password } = req.body;

    try {
        const created_at_result = await sql.query`
            SELECT CREATED_AT FROM USERS WHERE EMAIL = ${email}
        `;
        const created_at = created_at_result.recordset[0].CREATED_AT.toISOString().slice(0, 19).replace('T', ' ');
        const hashedAndEncryptedPassword = await generateHashedAndEncryptedPassword(new_password, created_at);

        const result = await sql.query`
            UPDATE USERS
            SET HASHED_AND_ENCRYPTED_PASSWORD = ${hashedAndEncryptedPassword}, STATUS = 'ACTIVE'
            WHERE EMAIL = ${email}
        `;

        console.log(`Password for user with EMAIL ${email} changed successfully`);
        return res.status(200).json({ message: `Password changed successfully` });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO UPDATE A USER
app.put('/api/update-user', async (req, res) => {
    const { editing_user_id, display_name, first_name, last_name, company, role, status, modified_by } = req.body;

    try {
        const modified_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await sql.query`
            UPDATE USERS
            SET DISPLAY_NAME=${display_name}, FIRST_NAME=${first_name}, LAST_NAME=${last_name}, COMPANY=${company}, ROLE=${role}, STATUS=${status}, MODIFIED_BY=${modified_by}, MODIFIED_AT=${modified_at}
            WHERE USER_ID = ${editing_user_id}
        `;

        console.log(`User with ID ${editing_user_id} updated successfully`);
        return res.status(200).json({ message: `User updated successfully` });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO DELETE A LIST OF SELECTED USERS
app.delete('/api/delete-selected-users', async (req, res) => {
    const { selected_users } = req.body;

    try {
        const result = await sql.query`DELETE FROM USERS WHERE USER_ID IN (${selected_users})`;
        console.log(`Users ${selected_users} deleted successfully`);
        return res.status(200).json({ message: 'Users deleted successfully' });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------- PARAMETER ROUTES START HERE -------------------

// ROUTE TO GET ALL PARAMETERS
app.get('/api/get-all-parameters', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM PARAMETERS`;
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO GET ALL PARAMETERS OF A POLYGON
app.post('/api/get-polygon-parameters', async (req, res) => {
    const { polygon_id } = req.body;

    console.log(`GETTING PARAMETERS FOR POLYGON WITH ID ${polygon_id}`);

    try {
        const polygonResults = await sql.query`
            SELECT * FROM POLYGON_PARAMETER_DEFAULT WHERE POLYGON_ID = ${polygon_id}`;
        
        if (polygonResults.recordset.length === 0) {
            return res.status(404).json({ error: 'No parameters found for this polygon' });
        }

        const parameterIds = polygonResults.recordset.map(p => p.PARAMETER_ID);
        const parameterResults = await sql.query`
            SELECT * FROM PARAMETERS WHERE PARAMETER_ID IN (${parameterIds})`;

        const parameterMap = Object.fromEntries(
            parameterResults.recordset.map(param => [param.PARAMETER_ID, param])
        );

        const polygonParameters = polygonResults.recordset.map(polygon => ({
            ...polygon,
            PARAMETER_NAME: parameterMap[polygon.PARAMETER_ID]?.PARAMETER_NAME || null,
            PARAMETER_UNIT: parameterMap[polygon.PARAMETER_ID]?.PARAMETER_UNIT || null,
            PARAMETER_TYPE: parameterMap[polygon.PARAMETER_ID]?.PARAMETER_TYPE || null,
        }));

        return res.status(200).json(polygonParameters);
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO ADD A PARAMETER
app.post('/api/add-parameter', async (req, res) => {
    const { parameter_name, parameter_unit, parameter_type, created_by } = req.body;

    try {
        const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await sql.query`
            INSERT INTO PARAMETERS (PARAMETER_NAME, PARAMETER_UNIT, PARAMETER_TYPE, CREATED_BY, CREATED_AT)
            VALUES (${parameter_name}, ${parameter_unit}, ${parameter_type}, ${created_by}, ${created_at})
        `;

        console.log(`Parameter with data :
            parameter_name = ${parameter_name},
            parameter_unit = ${parameter_unit},
            parameter_type = ${parameter_type},
            created_by = ${created_by},
            created_at = ${created_at}

            added successfully`);
        return res.status(201).json({ message: `Parameter added successfully` });
    
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO UPDATE A PARAMETER
app.put('/api/update-parameter', async (req, res) => {
    const { parameter_id, parameter_name, parameter_unit, parameter_type, status, modified_by } = req.body;

    try {
        const modified_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await sql.query`
            UPDATE PARAMETERS
            SET PARAMETER_NAME = ${parameter_name}, 
                PARAMETER_UNIT = ${parameter_unit}, 
                PARAMETER_TYPE = ${parameter_type}, 
                MODIFIED_BY = ${modified_by}, 
                MODIFIED_AT = ${modified_at}, 
                STATUS = ${status}
            WHERE PARAMETER_ID = ${parameter_id}
        `;

        if (result.rowsAffected === 0) {
            console.warn(`No parameter found with ID ${parameter_id}, update not applied.`);
            return res.status(404).json({ error: `Parameter with ID ${parameter_id} not found` });
        }

        console.log(`Parameter with ID ${parameter_id} updated successfully`);
        return res.status(200).json({ message: `Parameter updated successfully` });
    } catch (error) {
        console.error('Database query error:', error.message);

        let errorMessage = 'An unknown error occurred';
        let statusCode = 500;

        if (error.code) {
            switch (error.class) {
                case 14: 
                    errorMessage = `Duplicate entry: A parameter with this name already exists`;
                    statusCode = 409;
                    break;
                default:
                    errorMessage = `Database error: ${error.sqlMessage || error.message}`;
                    break;
            }
        } else {
            errorMessage = error.message;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
});

// ROUTE TO DELETE A LIST OF SELECTED PARAMETERS
app.delete('/api/delete-selected-parameters', async (req, res) => {
    const { selected_parameters } = req.body;

    try {

        await sql.query`DELETE FROM POLYGON_PARAMETER_DEFAULT WHERE PARAMETER_ID IN (${selected_parameters})`;

        const result = await sql.query`DELETE FROM PARAMETERS WHERE PARAMETER_ID IN (${selected_parameters})`;
        console.log(`Parameters ${selected_parameters} deleted successfully`);
        return res.status(200).json({ message: 'Parameters deleted successfully' });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO GET UNIQUE VALUES FOR STRING PARAMETERS
app.get('/api/get-unique-values-for-string-parameters', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT DISTINCT PARAMETER_ID, DEFAULT_VALUE
            FROM POLYGON_PARAMETER_DEFAULT
            WHERE PARAMETER_ID IN (
                SELECT PARAMETER_ID
                FROM PARAMETERS
                WHERE PARAMETER_TYPE = 'string'
            )
        `;

        const parameterMap = result.recordset.reduce((acc, row) => {
            if (!acc[row.PARAMETER_ID]) {
                acc[row.PARAMETER_ID] = new Set();
            }
            acc[row.PARAMETER_ID].add(row.DEFAULT_VALUE);
            return acc;
        }, {});

        const formattedResponse = Object.fromEntries(
            Object.entries(parameterMap).map(([key, value]) => [key, Array.from(value)])
        );

        return res.status(200).json(formattedResponse);
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------- POLYGON ROUTES START HERE -------------------

// ROUTE TO GET ALL POLYGONS
app.get('/api/get-all-polygons', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM POLYGONS`;
        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO GET ALL POLYGONS WITH PARAMETERS
app.get('/api/get-all-polygons-with-parameters', async (req, res) => {
    try {
        const polygonsResult = await sql.query`SELECT * FROM POLYGONS`;
        const polygons = polygonsResult.recordset;

        if (polygons.length === 0) {
            return res.status(200).json([]);
        }

        const polygonsWithParameters = await Promise.all(polygons.map(async (polygon) => {
            const parametersResult = await sql.query`
                SELECT * FROM POLYGON_PARAMETER_DEFAULT WHERE POLYGON_ID = ${polygon.POLYGON_ID}
            `;
            return {
                ...polygon,
                POLYGON_PARAMETERS: parametersResult.recordset,
            };
        }));

        return res.status(200).json(polygonsWithParameters);
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ROUTE TO ADD A NEW POLYGON
app.post('/api/add-polygon', async (req, res) => {
    const { polygon_name, polygon_mapper_id, polygon_parameters, created_by } = req.body;

    try {
        const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const polygon_insertion_result = await sql.query`
            INSERT INTO POLYGONS (POLYGON_NAME, POLYGON_MAPPER_ID, CREATED_BY, CREATED_AT)
            OUTPUT INSERTED.POLYGON_ID
            VALUES (${polygon_name}, ${polygon_mapper_id}, ${created_by}, ${created_at})
        `;

        for (const parameter of polygon_parameters) {
            await sql.query`
                INSERT INTO POLYGON_PARAMETER_DEFAULT (POLYGON_ID, PARAMETER_ID, DEFAULT_VALUE, CREATED_BY, CREATED_AT)
                VALUES (${polygon_insertion_result.recordset[0].POLYGON_ID}, ${parameter.PARAMETER_ID}, ${parameter.DEFAULT_VALUE}, ${created_by}, ${created_at})
            `;
        }

        console.log(`Polygon with name ${polygon_name} added successfully`);

        return res.status(201).json({ message: `Polygon added successfully` });

    } catch (error) {
        console.error('Database query error:', error.message);

        let errorMessage = 'An unknown error occurred';
        let statusCode = 500;

        if (error.code) {
            const errorText = error.message.toLowerCase();
            
            if (errorText.includes('uq_polygon_mapper_id')) {
                errorMessage = 'Duplicate entry: Polygon with this mapper ID already exists';
                statusCode = 409;
            } else if (errorText.includes('uq_polygon_name')) {
                errorMessage = 'Duplicate entry: Polygon with this name already exists';
                statusCode = 409;
            } else {
                errorMessage = `Database error: ${error.sqlMessage || error.message}`;
            }
        } else {
            errorMessage = error.message;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
});

// ROUTE TO UPDATE A POLYGON
app.put('/api/update-polygon', async (req, res) => {
    const { polygon_id, polygon_name, polygon_mapper_id, polygon_parameters, modified_by } = req.body;

    console.log(`Updating polygon with ID: ${polygon_id}`);

    try {
        const modified_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const result = await sql.query`
            UPDATE POLYGONS
            SET POLYGON_NAME = ${polygon_name}, POLYGON_MAPPER_ID = ${polygon_mapper_id}, MODIFIED_BY = ${modified_by}, MODIFIED_AT = ${modified_at}
            WHERE POLYGON_ID = ${polygon_id}
        `;

        await sql.query`
            DELETE FROM POLYGON_PARAMETER_DEFAULT WHERE POLYGON_ID = ${polygon_id}
        `;

        for (const parameter of polygon_parameters) {
            await sql.query`
                INSERT INTO POLYGON_PARAMETER_DEFAULT (POLYGON_ID, PARAMETER_ID, DEFAULT_VALUE, CREATED_BY, CREATED_AT)
                VALUES (${polygon_id}, ${parameter.PARAMETER_ID}, ${parameter.DEFAULT_VALUE}, ${modified_by}, ${modified_at})
            `;
        }


        if (result.rowsAffected === 0) {
            console.warn(`No polygon found with ID ${polygon_id}, update not applied.`);
            return res.status(404).json({ error: `Polygon with ID ${polygon_id} not found` });
        }

        console.log(`Polygon with ID ${polygon_id} updated successfully`);
        
        return res.status(200).json({ message: `Polygon updated successfully` });
    } catch (error) {
        console.error('Database query error:', error.message);

        let errorMessage = 'An unknown error occurred';
        let statusCode = 500;

        if (error.code) {
            switch (error.class) {
                case 14: 
                    errorMessage = `Duplicate entry: Polygon with this name already exists`;
                    statusCode = 409;
                    break;
                default:
                    errorMessage = `Database error: ${error.sqlMessage || error.message}`;
                    break;
            }
        } else {
            errorMessage = error.message;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
});

// ROUTE TO DELETE A LIST OF SELECTED POLYGONS
app.delete('/api/delete-selected-polygons', async (req, res) => {
    const { selected_polygons } = req.body;

    try {
        await sql.query`DELETE FROM POLYGON_PARAMETER_DEFAULT WHERE POLYGON_ID IN (${selected_polygons})`;
        
        await sql.query`DELETE FROM POLYGONS WHERE POLYGON_ID IN (${selected_polygons})`;
        
        console.log(`Polygons ${selected_polygons} deleted successfully`);
        return res.status(200).json({ message: 'Polygons deleted successfully' });
    } catch (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// API ENDPOINT TO GET ALL POLYGONS
app.get('/api/polygons', async (req, res) => {
    try {
        const query = `
            SELECT 
            id, 
            "AOIName" as name, 
            ST_AsGeoJSON(ST_Transform(geom, 4326)) as geojson
            FROM "ExamplePolygons_new"
        `;
        
        const result = await postgisPool.query(query);
        console.log(`Found ${result.rowCount} polygons`);
        
        const polygons = result.rows.map(row => {
            const geojson = JSON.parse(row.geojson);
            console.log(`Polygon ${row.id} type:`, geojson.type);

            let coords;
            if (geojson.type === 'Polygon') {
            console.log(`Polygon ${row.id} coordinates sample:`, 
                JSON.stringify(geojson.coordinates[0].slice(0, 2)));
            coords = [geojson.coordinates];
            } else if (geojson.type === 'MultiPolygon') {
            console.log(`MultiPolygon ${row.id} coordinates sample:`, 
                JSON.stringify(geojson.coordinates[0][0].slice(0, 2)));
            coords = geojson.coordinates;
            } else {
            console.log(`Unknown geometry type for polygon ${row.id}:`, geojson.type);
            coords = [];
            }

            return {
                id: row.id,
                name: row.name,
                coordinates: geojson.type === 'Polygon' ? [geojson.coordinates] : geojson.coordinates
            };
        });
        
        res.json(polygons);
    } catch (error) {
        console.error('Error fetching polygons:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));