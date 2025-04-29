"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Имитация отправки формы
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      
      // Сбросить форму после успешной отправки
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Сбросить статус после 5 секунд
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }, 1500);
  };

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
        
        <h1 className="text-3xl font-bold mb-6">Служба поддержки</h1>
        
        <div className="bg-[#151515] rounded-xl p-6 mb-8">
          <p className="text-white/70 mb-6">
            Мы здесь, чтобы помочь вам решить любые вопросы, связанные с использованием нашего сервиса. Заполните форму ниже, и наша команда свяжется с вами в кратчайшие сроки.
          </p>
          
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-900/50 rounded-lg text-green-200">
              Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200">
              Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз или свяжитесь с нами по email: support@aiphotogen.com
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-white/70 mb-1">Ваше имя</label>
                <input 
                  type="text" 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-[42px] bg-[#1A1A1A] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-white/70 mb-1">Email</label>
                <input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[42px] bg-[#1A1A1A] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-white/70 mb-1">Тема</label>
              <input 
                type="text" 
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-[42px] bg-[#1A1A1A] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-white/70 mb-1">Сообщение</label>
              <textarea 
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 bg-[#1A1A1A] rounded-lg border border-white/8 text-white p-4 focus:outline-none focus:border-white/30 transition-colors resize-none"
                required
              ></textarea>
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? "Отправка..." : "Отправить сообщение"}
            </button>
          </form>
        </div>
        
        <div className="bg-[#151515] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Другие способы связи</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Email</h3>
              <p className="text-white/70">support@imageni.org</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Время работы</h3>
              <p className="text-white/70">Пн-Пт, 10:00 - 19:00 (МСК)</p>
            </div>
            {/* <div>
              <h3 className="font-medium mb-1">Часто задаваемые вопросы</h3>
              <p className="text-white/70">
                Прежде чем обращаться в службу поддержки, ознакомьтесь с 
                <Link href="/faq" className="text-[#58E877] hover:underline ml-1">разделом FAQ</Link>
              </p>
            </div> 
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
