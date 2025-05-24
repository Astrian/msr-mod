<script setup lang="ts">
import { ref } from 'vue'

const inputFocused = ref(false)

</script>

<template>
	<div class="px-4 py-2 rounded-full backdrop-blur-3xl border"
		:class="inputFocused ? 'bg-white/50 border-[#c9c9c9]' : 'border-[#383838] bg-neutral-900/50'"
	>
		<input
			placeholder="搜索歌曲、专辑或音乐人..." 
			class="placeholder:italic w-96 text-base font-[MiSans] text-black" 
			:class="inputFocused? 'placeholder:text-neutral-900/50' : 'placeholder:text-white/50'"
			@focus="inputFocused = true"
			@blur="inputFocused = false"
		/>
	</div>
</template>