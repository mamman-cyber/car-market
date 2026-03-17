import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BuyerHelp() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [expandedFaq, setExpandedFaq] = useState(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const faqs = [
        {
            question: 'How do I save a car?',
            answer: 'To save a car, navigate to the car details page and tap the heart icon. The car will be added to your saved list.'
        },
        {
            question: 'How do I contact a dealer?',
            answer: 'You can contact a dealer by visiting their store page and using the chat widget, or from the car details page.'
        },
        {
            question: 'Can I negotiate the price?',
            answer: 'Yes, you can communicate with the dealer through our chat system to discuss pricing and any other inquiries.'
        },
        {
            question: 'How do I delete my account?',
            answer: 'Go to Settings > Delete Account to request account deletion. Note that this action is irreversible.'
        },
        {
            question: 'Is my personal information secure?',
            answer: 'Yes, we take data privacy seriously. Your information is encrypted and we follow best practices for data protection.'
        },
    ];

    const helpItems = [
        { icon: 'chat', title: 'Live Chat', description: 'Chat with our support team' },
        { icon: 'email', title: 'Email Support', description: 'support@autohub.com' },
        { icon: 'phone', title: 'Phone Support', description: '+234 800 AUTOHUB' },
        { icon: 'question_answer', title: 'FAQs', description: 'Frequently asked questions' },
    ];

    return (
        <div className="min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/buyer-profile')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full -ml-2 transition-colors">
                            <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
                        </button>
                        <p className="text-gray-900 dark:text-white text-lg font-bold">Help & Support</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
    {/* Contact Options */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {helpItems.map((item, index) => (
                        <button 
                            key={index}
                            onClick={() => {
                                if (item.title === 'Live Chat') navigate('/buyer-chats');
                                else if (item.title === 'Email Support') window.location.href = 'mailto:support@autohub.com';
                                else if (item.title === 'Phone Support') window.location.href = 'tel:+234800AUTOHUB';
                                else navigate('/buyer-profile'); // FAQs
                            }}
                            className="p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
                        >
                            <span className="material-symbols-outlined text-primary text-2xl mb-2 block">
                                {item.icon}
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                        </button>
                    ))}
                </div>

                {/* FAQs */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Frequently Asked Questions</h3>
                <div className="space-y-2">
                    {faqs.map((faq, index) => (
                        <div 
                            key={index}
                            className="p-4 rounded-xl bg-white dark:bg-gray-800"
                        >
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{faq.question}</p>
                                <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>
                            {expandedFaq === index && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{faq.answer}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
                <div className="flex justify-around items-center h-16">
                    <Link to="/home" className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full">
                        <span className="material-symbols-outlined">home</span>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>
                    <Link to="/buyer-saved" className="flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 flex-1 h-full">
                        <span className="material-symbols-outlined">favorite</span>
                        <span className="text-[10px] font-medium">Saved</span>
                    </Link>
                    <Link to="/buyer-profile" className="flex flex-col items-center justify-center gap-1 text-primary flex-1 h-full">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

