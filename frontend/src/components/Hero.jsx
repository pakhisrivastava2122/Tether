import React from 'react';

export default function Hero() {
    return (
        <section className="relative h-[85vh] flex items-center justify-center text-center text-white bg-gradient-to-br from-slate-900 to-indigo-800 px-4">
            <div className="relative z-10 max-w-3xl">
                <h2 className="text-5xl md:text-7xl font-extrabold mb-6">Find Your Child</h2>
                <p className="text-xl md:text-2xl text-slate-200 mb-10 max-w-2xl mx-auto">
                    Connecting lost children with families using AI-powered facial recognition.
                </p>
                <a
                    href="#report-form"
                    className="bg-cyan-500 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-cyan-600 transition-transform transform hover:scale-105 shadow-lg"
                >
                    File a Report Now
                </a>
            </div>
            <div className="absolute inset-0 bg-black opacity-10"></div>
        </section>
    );
}