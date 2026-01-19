import { toastController } from "@ionic/vue";

const showToast = async (message: string, duration: number, icon: string, color: string, position: 'top' | 'bottom' | 'middle'): Promise<void>  => {
  const toast = await toastController.create({
    message: message,
    duration: duration,
    icon: icon,
    color: color,
    position: position
  });
  await toast.present();
}

export { showToast };