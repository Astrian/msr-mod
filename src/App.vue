<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import Playing from './components/Playing.vue'
</script>

<template>
	<div class="w-screen h-screen overflow-hidden">
		<div class="flex flex-1 w-full h-full">
			<Sidebar />
			<div class="flex-1 bg-[#070909] w-full overflow-y-auto">
				<RouterView />
			</div>
		</div>
		
		<Playing />
	</div>
</template>