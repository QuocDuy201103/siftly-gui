import { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
    title: "Siftly - Contact Management Platform",
    description: "Manage customer contacts with AI-powered chatbot integration",
    openGraph: {
        title: "Siftly",
        description: "Contact Management Platform",
    },
};

export default function HomePage() {
    return <LandingPage />;
}
