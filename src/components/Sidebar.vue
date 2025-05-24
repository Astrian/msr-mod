<script lang="ts" setup>
	import { RouterLink } from 'vue-router'
</script>

<template>
	<div class="bg-[#0c1112] w-56 text-white p-4">
		<div>
			<div class="font-semibold text-white/50 text-xs mb-2">音乐库</div>
			<ul class="flex flex-col gap-1">
				<li>
					<RouterLink to="/"><div class="text-sm px-2 py-1 hover:bg-white/5 w-full text-left rounded-md">最新音乐</div></RouterLink>
				</li>
				<li>
					<RouterLink to="/feelinglucky"><div class="text-sm px-2 py-1 hover:bg-white/5 w-full text-left rounded-md">手气不错</div></RouterLink>
				</li>
			</ul>
		</div>
	</div>
</template>