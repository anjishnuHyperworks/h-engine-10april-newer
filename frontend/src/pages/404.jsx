import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

function LoadErrorPage() {
    return (
        <div className="h-screen w-full flex flex-col justify-center items-center bg-primary uppercase">
            <div className='max-w-[60%] flex flex-col items-center gap-4'>
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-contrast text-[5vw]" />
                <h1>OOPS, the page you requested was <strong>not found</strong></h1>
            </div>
        </div>
    );
}

export default LoadErrorPage;