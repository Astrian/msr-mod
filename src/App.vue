<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import Playing from './components/Playing.vue'
</script>

<template>
	<div class="flex overflow-hidden flex-1 w-screen h-screen">
		<Sidebar />
		<div class="flex-1 bg-[#070909]">
			<Playing />
			<RouterView />
		</div>
	</div>
</template>