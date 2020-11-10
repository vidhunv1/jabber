import React from 'react'
import cn from 'classnames'

export const Avatar = ({ seed, className }: { seed: string; className?: string }) => (
  <img
    src={`https://avatars.dicebear.com/api/human/${seed}.svg`}
    className={cn(className, 'w-10 h-10 rounded-full bg-yellow-100 p-1')}
  />
)
