/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/api/chat/:path*',
                destination: `${process.env.CHATBOT_BASE_URL}/api/chat/:path*`,
            },
            {
                source: '/api/zoho/:path*',
                destination: `${process.env.CHATBOT_BASE_URL}/api/zoho/:path*`,
            },
        ];
    },
};

export default nextConfig;
