"use client";
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <Link href="/profile" className="flex items-center text-white/70 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ml-2">Назад в профиль</span>
          </Link>
        </div>
        
        <div className="mb-6 flex items-center">
          <nav className="flex text-sm text-white/50">
            <Link href="/" className="hover:text-white">Главная</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Контакты</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-opacity-5 p-8 md:p-10 rounded-2xl" style={{ background: '#242424' }}>
            <h1 className="text-3xl font-bold mb-6">Контакты</h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg">
                Email: <a href="mailto:support@imageni.org" className="text-blue-400 hover:underline">support@imageni.org</a>
              </p>
            </div>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden h-64 md:h-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/40"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-lg font-medium">Мы готовы ответить на ваши вопросы</p>
                <p className="text-white/70">Свяжитесь с нами по электронной почте</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="text-sm text-white/50">
            <p>ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ГАРАНТИЯ"</p>
            <p>ИНН: 5503278298</p>
            <p>КПП: 550301001</p>
            <p>Юридический адрес: 644013, РОССИЯ, ОМСКАЯ ОБЛАСТЬ, Г.О. ГОРОД ОМСК, Г ОМСК, УЛ КРАСНОЗНАМЕННАЯ, Д. 20, КВ. 111</p>
          </div>
        </div>
      </div>
    </div>
  );
}
