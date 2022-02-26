<template>
    <div>
        <h1 class="h1">{{ count }}</h1>
        <button @click="setCount">click</button>
    </div>
</template>

<script>
import { ref } from "vue";

export default {
    setup() {
        const count = ref(0);

        const setCount = () => {
            count.value++;
        }

        return {
            count,
            setCount
        };
    }
};
</script>

<style>
    .h1{
        color: blue;
    }

    body {
        background: #eeeeee;
    }
</style>