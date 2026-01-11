import React, { useState, useRef, useEffect } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';

// Cell types
export const CELL_TYPES = {
    TEXT: 'text',
    NUMBER: 'number',
    DROPDOWN: 'dropdown',
    IMAGE: 'image',
    LINK: 'link',
    CHECKBOX: 'checkbox'
};

// Dropdown options for common fields
export const DROPDOWN_OPTIONS = {
    'โซน': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    'เกรด': ['A', 'B', 'C', 'D'],
    'ประเภท': ['ที่ดิน', 'บ้าน', 'คอนโดมิเนียม', 'ทาวน์เฮ้าส์', 'โรงงาน', 'โกดัง', 'อาคารพาณิชย์'],
    'สถานะ': ['ขาย', 'เช่า', 'ขายแล้ว', 'จองแล้ว']
};

function EditableCell({
    value,
    rowIndex,
    colIndex,
    columnName,
    cellType = CELL_TYPES.TEXT,
    options = [],
    isEditing = false,
    isSelected = false,
    onStartEdit,
    onEndEdit,
    onValueChange,
    onNavigate,
    className = ''
}) {
    const [editValue, setEditValue] = useState(value);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);
    const cellRef = useRef(null);

    // Get dropdown options based on column name
    const dropdownOptions = options.length > 0 ? options : (DROPDOWN_OPTIONS[columnName] || []);
    const isDropdownType = cellType === CELL_TYPES.DROPDOWN || dropdownOptions.length > 0;

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        if (cellType !== CELL_TYPES.IMAGE) {
            onStartEdit?.(rowIndex, colIndex);
        }
    };

    const handleClick = () => {
        if (isDropdownType && !isEditing) {
            setShowDropdown(true);
            onStartEdit?.(rowIndex, colIndex);
        }
    };

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                handleSave();
                break;
            case 'Escape':
                e.preventDefault();
                handleCancel();
                break;
            case 'Tab':
                e.preventDefault();
                handleSave();
                onNavigate?.(rowIndex, colIndex + (e.shiftKey ? -1 : 1));
                break;
            case 'ArrowUp':
                if (!isEditing) {
                    e.preventDefault();
                    onNavigate?.(rowIndex - 1, colIndex);
                }
                break;
            case 'ArrowDown':
                if (!isEditing) {
                    e.preventDefault();
                    onNavigate?.(rowIndex + 1, colIndex);
                }
                break;
            case 'ArrowLeft':
                if (!isEditing) {
                    e.preventDefault();
                    onNavigate?.(rowIndex, colIndex - 1);
                }
                break;
            case 'ArrowRight':
                if (!isEditing) {
                    e.preventDefault();
                    onNavigate?.(rowIndex, colIndex + 1);
                }
                break;
        }
    };

    const handleSave = () => {
        if (editValue !== value) {
            onValueChange?.(rowIndex, colIndex, editValue);
        }
        setShowDropdown(false);
        onEndEdit?.();
    };

    const handleCancel = () => {
        setEditValue(value);
        setShowDropdown(false);
        onEndEdit?.();
    };

    const handleDropdownSelect = (option) => {
        setEditValue(option);
        onValueChange?.(rowIndex, colIndex, option);
        setShowDropdown(false);
        onEndEdit?.();
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return '';
        if (cellType === CELL_TYPES.NUMBER && typeof val === 'number') {
            return val.toLocaleString('th-TH');
        }
        return String(val);
    };

    // Base cell styles
    const baseCellClass = `
        relative px-2 py-1.5 text-sm border-r border-b border-gray-200
        min-h-[36px] transition-all duration-100
        ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset z-10' : 'hover:bg-gray-50'}
        ${className}
    `;

    // Render dropdown cell
    if (isDropdownType) {
        return (
            <td
                ref={cellRef}
                className={baseCellClass + ' cursor-pointer'}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{formatValue(editValue)}</span>
                    <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                </div>

                {showDropdown && (
                    <>
                        <div
                            className="fixed inset-0 z-20"
                            onClick={() => { setShowDropdown(false); onEndEdit?.(); }}
                        />
                        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-[120px] max-h-[200px] overflow-auto">
                            {dropdownOptions.map((option, idx) => (
                                <div
                                    key={idx}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${editValue === option ? 'bg-blue-100 text-blue-700' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDropdownSelect(option);
                                    }}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </td>
        );
    }

    // Render number input
    if (cellType === CELL_TYPES.NUMBER) {
        return (
            <td
                ref={cellRef}
                className={baseCellClass}
                onDoubleClick={handleDoubleClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <input
                            ref={inputRef}
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="w-full px-1 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                ) : (
                    <span className="block truncate text-right font-mono">
                        {formatValue(value)}
                    </span>
                )}
            </td>
        );
    }

    // Render text input (default)
    return (
        <td
            ref={cellRef}
            className={baseCellClass}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {isEditing ? (
                <div className="flex items-center gap-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full px-1 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            ) : (
                <span className="block truncate" title={formatValue(value)}>
                    {formatValue(value)}
                </span>
            )}
        </td>
    );
}

export default EditableCell;
