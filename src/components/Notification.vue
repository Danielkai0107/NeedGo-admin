<template>
  <transition name="notification">
    <div
      v-if="message"
      class="alert position-fixed top-0 start-50 translate-middle-x mt-3"
      :class="alertClass"
      style="z-index: 1060; min-width: 300px"
      role="alert"
    >
      <div class="d-flex align-items-center">
        <span>{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: "Notification",
  props: {
    message: { type: String, default: "" },
    type: { type: String, default: "success" },
  },
  computed: {
    alertClass() {
      const typeClasses = {
        success: "alert-success",
        error: "alert-danger",
        warning: "alert-warning",
        info: "alert-info",
      };
      return typeClasses[this.type] || "alert-primary";
    },
  },
};
</script>
