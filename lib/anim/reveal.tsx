'use client';

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useReducedMotion } from './hooks';

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  repeat?: boolean;
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.6,
  repeat = false,
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, margin: '-8% 0px -8% 0px' }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  stagger?: number;
  baseDelay?: number;
}

export function RevealGroup({ children, stagger = 0.08, baseDelay = 0 }: RevealGroupProps) {
  let i = 0;
  return (
    <>
      {Children.map(children, (child) => {
        if (isValidElement(child) && child.type === Reveal) {
          const el = child as ReactElement<RevealProps>;
          const next = cloneElement(el, { delay: baseDelay + i * stagger });
          i += 1;
          return next;
        }
        return child;
      })}
    </>
  );
}
