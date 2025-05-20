import Notify from "simple-notify";

export const showNotification = (text, status = 'success', title = 'Success') => {
  return new Notify({
    status,
    title,
    text,
    effect: 'fade',
    speed: 300,
    customClass: null,
    customIcon: null,
    showIcon: true,
    autoclose: true,
    autotimeout: 9000,
    position: 'right top'
  });
};
