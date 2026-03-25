/**
 * Stepper Component
 * Displays a horizontal progress indicator with multiple steps
 */

import { FC } from 'react';

export interface IStepperProps {
    steps: string[];
    activeStep: number;
    className?: string;
}

const Stepper: FC<IStepperProps> = ({ steps, activeStep, className = '' }) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                    {/* Step Circle */}
                    <div
                        className={`
                            flex items-center justify-center w-12 h-12 rounded-full font-semibold text-sm
                            transition-all duration-300
                            ${
                                index < activeStep
                                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                                    : index === activeStep
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 scale-110'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }
                        `}
                    >
                        {index < activeStep ? (
                            <span className="text-lg">✓</span>
                        ) : (
                            index + 1
                        )}
                    </div>

                    {/* Step Label */}
                    <div className="ml-3 min-w-0 flex-1">
                        <p
                            className={`
                                text-sm font-medium truncate
                                ${
                                    index <= activeStep
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400'
                                }
                            `}
                        >
                            {step}
                        </p>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <div
                            className={`
                                h-1 flex-1 mx-2 transition-all duration-300
                                ${
                                    index < activeStep
                                        ? 'bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }
                            `}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default Stepper;
