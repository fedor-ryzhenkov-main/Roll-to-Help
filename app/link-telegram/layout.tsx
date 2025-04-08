import React from 'react';

export const metadata = {
  title: 'Вход через Telegram - Roll to Help',
  description: 'Подключите свой Telegram аккаунт для участия в наших благотворительных настольных мероприятиях',
};

export default function LinkTelegramLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
} 