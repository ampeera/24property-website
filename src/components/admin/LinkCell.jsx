import React, { useState } from 'react';
import { MapPin, ExternalLink, Copy, Check, Edit2 } from 'lucide-react';

function LinkCell({
    value,
    rowIndex,
    colIndex,
    isSelected = false,
    onValueChange,
    onStartEdit,
    className = ''
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');
    const [copied, setCopied] = useState(false);

    const hasLink = value && value.length > 0;

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setShowMenu(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditValue(value || '');
        setShowMenu(false);
    };

    const handleSave = () => {
        onValueChange?.(rowIndex, colIndex, editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    // Base cell styles
    const baseCellClass = `
        relative px-2 py-1.5 text-sm border-r border-b border-gray-200
        min-h-[36px] transition-all duration-100
        ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset z-10' : 'hover:bg-gray-50'}
        ${className}
    `;

    if (isEditing) {
        return (
            <td className={baseCellClass}>
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full px-1 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="วาง URL แผนที่..."
                />
            </td>
        );
    }

    return (
        <td className={baseCellClass} style={{ maxWidth: 80 }}>
            <div
                className="flex items-center justify-center cursor-pointer"
                onClick={() => setShowMenu(!showMenu)}
            >
                {hasLink ? (
                    <div className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                        <MapPin size={14} />
                        <span className="text-xs">แผนที่</span>
                    </div>
                ) : (
                    <div className="text-gray-400 hover:text-gray-600">
                        <MapPin size={14} />
                    </div>
                )}
            </div>

            {/* Action Menu */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[140px] overflow-hidden">
                        {hasLink && (
                            <>
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-blue-600"
                                    onClick={() => setShowMenu(false)}
                                >
                                    <ExternalLink size={14} />
                                    <span>เปิดแผนที่</span>
                                </a>
                                <div
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-500" />}
                                    <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก URL'}</span>
                                </div>
                                <hr className="border-gray-200" />
                            </>
                        )}
                        <div
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                            onClick={handleEdit}
                        >
                            <Edit2 size={14} className="text-gray-500" />
                            <span>{hasLink ? 'แก้ไข URL' : 'เพิ่ม URL'}</span>
                        </div>
                    </div>
                </>
            )}
        </td>
    );
}

export default LinkCell;
