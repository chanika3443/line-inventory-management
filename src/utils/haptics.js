// Haptic Feedback Utility
// ใช้สำหรับสั่นเบาๆ เวลากดปุ่ม (iOS style)

export const haptics = {
  // สั่นเบาๆ สำหรับการกดปุ่มทั่วไป
  light: () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10)
    }
  },

  // สั่นปานกลาง สำหรับการยืนยัน
  medium: () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20)
    }
  },

  // สั่นแรง สำหรับการสำเร็จ
  success: () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([10, 50, 10])
    }
  },

  // สั่นสำหรับ error
  error: () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([20, 50, 20, 50, 20])
    }
  },

  // สั่นสำหรับการเลือก
  selection: () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(5)
    }
  }
}
