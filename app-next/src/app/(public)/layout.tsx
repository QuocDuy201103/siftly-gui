import { ChatWidget } from "@/components/ChatWidget";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
            <ChatWidget />
        </>
    );
}
