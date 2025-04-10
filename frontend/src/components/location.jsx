import React, { useState, useEffect } from 'react';

const GetLocation = () => {
    const [locationString, setLocationString] = useState('Failed');

    const getHtml5Location = () => {
        return new Promise((resolve, reject) => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const geocodingResponse = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
                            );
                            const geocodingData = await geocodingResponse.json();

                            const city = geocodingData.address.city || 
                                        geocodingData.address.town || 
                                        geocodingData.address.village || 
                                        'Unknown';
                            const state = geocodingData.address.state || 
                                        geocodingData.address.province || 
                                        'Unknown';
                            const country = geocodingData.address.country || 'Unknown';

                            resolve(`${city}, ${state}, ${country}`);
                        } catch (geocodingError) {
                            reject(geocodingError);
                        }
                    },
                    (error) => {
                        reject(error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
    };

    const getIpLocation = async () => {
        const services = [
            'https://ipapi.co/json/',
            'https://ip-api.com/json/',
            'https://ipinfo.io/json'
        ];

        for (const serviceUrl of services) {
            try {
                const response = await fetch(serviceUrl);
                const data = await response.json();

                const city = data.city || data.location?.city || 'Unknown';
                const state = data.region || data.location?.region || 'Unknown';
                const country = data.country_name || data.country || data.location?.country || 'Unknown';

                return `${city}, ${state}, ${country}`;
            } catch (serviceError) {
                console.warn(`Failed to fetch from ${serviceUrl}:`, serviceError);
                continue;
            }
        }

        throw new Error('All IP geolocation services failed');
    };

    const trackLocation = async () => {
        try {
            const locationData = await getHtml5Location();
            return locationData;
        } catch (html5Error) {
            try {
                const ipLocationData = await getIpLocation();
                return ipLocationData;
            } catch (ipError) {
                return 'Failed';
            }
        }
    };

    return trackLocation;
};

export default GetLocation;