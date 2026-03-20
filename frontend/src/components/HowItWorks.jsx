import React from 'react';
import {IconFileText, IconSearch, IconHeart} from './icons/Icons';


export default function HowItWorks() {
    const steps = [
        {
            icon: <IconFileText />,
            title: '1. Submit a Report',
            description: 'A parent or volunteer submits a secure form with a photo and key details.',
        },
        {
            icon: <IconSearch />,
            title: '2. AI Matching',
            description: 'Our facial recognition model scans the database for potential matches.',
        },
        {
            icon: <IconHeart />,
            title: '3. Safe Reconnection',
            description: 'When a match is found, parents and volunteers are connected for safe reunions.',
        },
    ];


    return (
        <section className="py-20 bg-slate-100">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">How Tether Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((s) => (
                        <div key={s.title} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                            <div className="flex justify-center mb-6">{s.icon}</div>
                            <h3 className="text-xl font-bold mb-3 text-slate-800">{s.title}</h3>
                            <p className="text-slate-600">{s.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}