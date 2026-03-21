/**
 * Spinner.jsx
 * Reusable loading spinner — size & color customizable.
 */
export default function Spinner({ size = 'md', fullScreen = false }) {
    const sizes = { sm: 'h-5 w-5 border-2', md: 'h-8 w-8 border-4', lg: 'h-12 w-12 border-4' };
    const spinner = (
        <div className={`${sizes[size]} border-blue-500 border-t-transparent rounded-full animate-spin`} />
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    {spinner}
                    <p className="text-sm text-gray-500">Loading…</p>
                </div>
            </div>
        );
    }

    return spinner;
}
