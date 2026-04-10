import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ title, variant = 'primary', style, ...props }: ButtonProps) {
  return (
    <TouchableOpacity style={[styles.base, styles[variant], style]} {...props}>
      <Text style={[styles.text, variant === 'ghost' && styles.textGhost]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#00C896' },
  secondary: { backgroundColor: '#14141C', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#FF4B4B' },
  text: { color: '#0A0A0F', fontWeight: '600', fontSize: 16 },
  textGhost: { color: '#8E8EA0' },
});
