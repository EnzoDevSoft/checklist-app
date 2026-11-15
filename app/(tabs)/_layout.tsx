// Coloque este arquivo em app/_layout.tsx (e apague o _layout.tsx do template, que referencia "(tabs)" e "modal")
import { Stack } from "expo-router"
import Toast, { BaseToast, ToastConfigParams } from "react-native-toast-message"

const base = {
  height: 95,
}

const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={{ ...base, borderLeftColor: "#22c55e" }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 18, fontWeight: "bold" }}
      text2Style={{ fontSize: 16 }}
    />
  ),
  error: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={{ ...base, borderLeftColor: "#ef4444" }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ fontSize: 18, fontWeight: "bold" }}
      text2Style={{ fontSize: 16 }}
    />
  ),
}

export default function Layout() {
  return (
    <>
      <Stack />
      <Toast config={toastConfig} />
    </>
  )
}
