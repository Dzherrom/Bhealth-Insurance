'use client';
import React from 'react';

interface BoxComponentProps {
    title: string;
    value: string | number;
}

const BoxComponent = ({title, value} : BoxComponentProps) => {
    return (
        <div className="w-full h-32 rounded-xl bg-muted/50 p-4 shadow-black-700/10 shadow-md flex flex-col justify-center items-start">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-xl font-bold  text-green-600">{value}</p>
        </div>
    );
}
export default BoxComponent;