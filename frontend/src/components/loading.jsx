function LoadLoader() {
    return (
        <div className="loader fixed top-0 left-0 w-full h-full bg-transparent flex justify-center items-center z-[2147483647]">
            <img src="/koloma-logo.png" alt="" className="h-[4rem]" id="loader-logo"/>
        </div>
    )
}

export default LoadLoader;