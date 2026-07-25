type IconName =
  | 'calendar'
  | 'location'
  | 'email'
  | 'briefcase'
  | 'dev'
  | 'twitter'
  | 'clipboard'
  | 'education'
  | 'trophy'
  | 'check'
  | 'arrowRight'
  | 'arrowLeft'
  | 'arrowDown'
  | 'arrowUp'
  | 'search';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className = '' }: IconProps) {
  const common = {
    // Use style to ensure consistent CSS sizing in flex/inline contexts
    style: { width: `${size}px`, height: `${size}px` },
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg',
    preserveAspectRatio: 'xMidYMid meet',
    // Block-level, non-shrinking to avoid width variance across contexts
    className: `block flex-none ${className}`,
  } as const;

  switch (name) {
    case 'calendar':
      return (
        <svg {...common}>
          <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 7H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9Z"/>
        </svg>
      );
    case 'location':
      return (
        <svg {...common}>
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/>
        </svg>
      );
    case 'email':
      return (
        <svg {...common}>
          <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/>
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...common}>
          <path d="M9 4h6a2 2 0 0 1 2 2v2h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1h2V6a2 2 0 0 1 2-2Zm0 4h6V6H9v2Zm12 4H3v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6Z"/>
        </svg>
      );
    case 'dev':
      return (
        <svg {...common}>
          <path d="M8.5 7 4 11.5 8.5 16l1.4-1.4L6.8 11.5 9.9 8.4 8.5 7Zm7 0-1.4 1.4 3.1 3.1-3.1 3.1L15.5 16 20 11.5 15.5 7Z"/>
        </svg>
      );
    case 'twitter':
      return (
        <svg {...common}>
          <path d="M21 5.6c-.7.3-1.5.6-2.3.7.8-.5 1.4-1.2 1.7-2.1-.7.4-1.6.8-2.4 1-1.4-1.5-3.8-1.4-5.1.2a3.7 3.7 0 0 0-1 2.6c0 .3 0 .5.1.8-3-.2-5.7-1.7-7.5-4.1-.4.6-.6 1.3-.6 2 0 1.3.7 2.5 1.7 3.2-.6 0-1.2-.2-1.7-.5v.1c0 1.9 1.4 3.5 3.2 3.9-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.6 2 2.7 3.7 2.8A7.5 7.5 0 0 1 3 19.3 10.5 10.5 0 0 0 8.7 21c6.3 0 9.8-5.3 9.8-9.8v-.5c.7-.4 1.4-1.1 1.9-1.8Z"/>
        </svg>
      );
    case 'clipboard':
      return (
        <svg {...common}>
          <path d="M9 3h6a2 2 0 0 1 2 2h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1a2 2 0 0 1 2-2Zm0 2v1h6V5H9Z"/>
        </svg>
      );
    case 'education':
      return (
        <svg {...common}>
          <path d="M12 3 2 8l10 5 10-5-10-5Zm0 7.7L6 8.2v4.9c0 2.2 3.2 3.9 6 3.9s6-1.7 6-3.9V8.2l-6 2.5Z"/>
        </svg>
      );
    case 'trophy':
      return (
        <svg {...common}>
          <path d="M18 4h3v2a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 13.9V17h3v2H8v-2h3v-3.1A6 6 0 0 1 7.3 10H7a4 4 0 0 1-4-4V4h3V2h12v2Zm0 2V4H6v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z"/>
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m10 16.2-3.3-3.3-1.4 1.4L10 19l9-9-1.4-1.4L10 16.2Z" />
        </svg>
      );
    case 'arrowRight':
      return (
        <svg {...common}>
          <path d="M13 5l7 7-7 7-1.4-1.4L16.2 13H4v-2h12.2L11.6 6.4 13 5Z"/>
        </svg>
      );
    case 'arrowLeft':
      return (
        <svg {...common}>
          <path d="M11 19l-7-7 7-7 1.4 1.4L7.8 11H20v2H7.8l4.6 4.6L11 19Z"/>
        </svg>
      );
    case 'arrowDown':
      return (
        <svg {...common}>
          <path d="M5 11l7 7 7-7-1.4-1.4L13 15.2V4h-2v11.2L6.4 9.6 5 11Z"/>
        </svg>
      );
    case 'arrowUp':
      return (
        <svg {...common}>
          <path d="M19 13l-7-7-7 7 1.4 1.4L11 8.8V20h2V8.8l4.6 5.6L19 13Z"/>
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/>
        </svg>
      );
    default:
      return null;
  }
}
