import { Minus, Plus } from 'lucide-react'
import React from 'react'

export default function QTY({ quantity, setQuantity }: { quantity: number, setQuantity: (quantity: number) => void }) {
    return (
        <div>
            <div className="flex items-center gap-1.5">
                <div className="flex items-center overflow-hidden gap-1">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95"
                    >
                        <Minus size={16} color="#141B34" />
                    </button>
                    <span className="w-12 text-center font-semibold text-black bg-gray-100 py-1 rounded-full text-sm">
                        {quantity}
                    </span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 text-gray-900"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
