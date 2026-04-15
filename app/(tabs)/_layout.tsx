import { Stack } from "expo-router"
import Toast, { BaseToast, ToastConfigParams } from "react-native-toast-message"

const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#22c55e",
        height: 95,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      text1Style={{
        fontSize: 18,
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 16,
      }}
    />
  ),

  error: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#ef4444",
        height: 95,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      text1Style={{
        fontSize: 18,
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 16,
      }}
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