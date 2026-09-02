module.exports = {
  content: ["./**/*.html"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#0D0D0D',
        neon: { blue:'#00A8FF', yellow:'#FFD600', green:'#00FF7F', red:'#FF2D2D', gray:'#A0AEC0', orange:'#FF6B00', purple:'#BF5FFF' },
        soft: { blue:'#EBF5FF', yellow:'#FFFDE7', green:'#EAFFF4', red:'#FFF0F0', gray:'#F5F5F7', orange:'#FFF3E0', purple:'#F5EEFF' },
      },
      boxShadow: {
        'glow-blue':'0 0 12px 2px rgba(0,168,255,0.55)',
        'glow-yellow':'0 0 12px 2px rgba(255,214,0,0.55)',
        'glow-green':'0 0 12px 2px rgba(0,255,127,0.55)',
        'glow-red':'0 0 12px 2px rgba(255,45,45,0.55)',
        'glow-gray':'0 0 12px 2px rgba(160,174,192,0.45)',
        'glow-orange':'0 0 12px 2px rgba(255,107,0,0.55)',
        'glow-purple':'0 0 12px 2px rgba(191,95,255,0.55)',
      },
      backdropBlur: { xs: '4px' },
    }
  }
}
