import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function GenerateReportModal({ isOpen, onClose }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate New Report">
            <form className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Student</label>
                    <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option>John Doe</option>
                        <option>Jane Smith</option>
                        <option>Alex Johnson</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date Range</label>
                    <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>This Semester</option>
                        <option>Custom Range...</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Include Parameters</label>
                    <div className="space-y-2">
                        {['Sleep Patterns', 'Physical Activity', 'Stress Levels', 'Screen Time'].map((param) => (
                            <label key={param} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300" defaultChecked />
                                <span className="text-sm text-gray-600">{param}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" onClick={(e) => { e.preventDefault(); onClose(); }}>Generate Report</Button>
                </div>
            </form>
        </Modal>
    );
}
