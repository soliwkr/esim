import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react';
import { clsx } from 'clsx';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx('sr-button', className)} {...props} />;
}

export function Card({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return <article className={clsx('sr-card', className)} {...props} />;
}
