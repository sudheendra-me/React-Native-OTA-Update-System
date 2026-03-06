import { ToastAndroid } from "react-native";

export const showToast = (value: string): void => {
  ToastAndroid.showWithGravity(value, ToastAndroid.SHORT, ToastAndroid.CENTER);
};
