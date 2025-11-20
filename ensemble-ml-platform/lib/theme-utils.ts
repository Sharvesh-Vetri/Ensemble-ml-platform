// Theme utilities for dynamic color theming

export function getPrimaryClass(isAutomobile: boolean, isConcrete: boolean, classType: 'text' | 'bg' | 'border' | 'from' | 'to') {
  const color = isAutomobile ? 'red-500' : isConcrete ? 'yellow-500' : 'primary'
  
  switch (classType) {
    case 'text':
      return `text-${color}`
    case 'bg':
      return `bg-${color}`
    case 'border':
      return `border-${color}`
    case 'from':
      return `from-${color}`
    case 'to':
      return `to-${color}`
    default:
      return ''
  }
}

export function getThemeColors(isAutomobile: boolean, isConcrete: boolean) {
  return {
    primary: isAutomobile ? "red-500" : isConcrete ? "yellow-500" : "primary",
    primaryHover: isAutomobile ? "red-600" : isConcrete ? "yellow-600" : "primary",
    primaryLight: isAutomobile ? "red-500/20" : isConcrete ? "yellow-500/20" : "primary/20",
    primaryBg: isAutomobile ? "bg-red-500" : isConcrete ? "bg-yellow-500" : "bg-primary",
    primaryText: isAutomobile ? "text-red-500" : isConcrete ? "text-yellow-500" : "text-primary",
    primaryBorder: isAutomobile ? "border-red-500" : isConcrete ? "border-yellow-500" : "border-primary",
    primaryGradient: isAutomobile 
      ? "from-red-500/20 via-red-500/10 to-transparent" 
      : isConcrete 
      ? "from-yellow-500/20 via-yellow-500/10 to-transparent"
      : "from-primary/20 via-primary/10 to-transparent",
  }
}

