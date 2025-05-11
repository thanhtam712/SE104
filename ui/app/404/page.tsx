import Link from 'next/link';
import Image from 'next/image';

export default function Custom404() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
            <h1 className="text-6xl font-bold text-blue-600">404</h1>
            <h2 className="mt-4 text-2xl font-semibold">Oops! Page Not Found</h2>
            <p className="mt-2 text-center text-gray-600">
                It seems like the page you&lsquo;re looking for doesn&lsquo;t exist. Maybe our chatbot can help you find your way!
            </p>
            <div className="mt-6">
                <Link href="/">
                    <a className="px-6 py-3 text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700">
                        Go Back Home
                    </a>
                </Link>
            </div>
            <div className="mt-10">
                <Image
                    src="/chatbot_admission_logo.png"
                    alt="Chatbot Illustration"
                    layout="fill"
                    objectFit="contain"
                />
            </div>
            <p className="mt-4 text-sm text-gray-500">
                Need help? Try asking our chatbot for assistance!
            </p>
        </div>
    );
}