import React from 'react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 py-12">
            <div className="container mx-auto px-4 text-center">
                <p>&copy; {new Date().getFullYear()} Tether. All rights reserved.</p>
                <p className="text-sm mt-2">A project dedicated to reuniting families.</p>
            </div>
        </footer>
    );
}
