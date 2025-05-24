<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePlayQueueStore } from './stores/usePlayQueueStore'

const playQueueStore = usePlayQueueStore()

const route = useRoute()
</script>

<template>
	<div class="w-screen h-screen overflow-hidden bg-[#191919]">
		<div class="flex flex-col w-full h-full overflow-y-auto pb-24">
			<div class="py-8 px-4 md:px-8 sticky top-0 bg-gradient-to-b from-[#00000080] to-transparent z-10">
				<div class="flex justify-between align-center h-[2.625rem] items-center">
					<ul class="flex gap-4"  v-if="(() => {
						if (route.path === '/lucky' || route.path === '/library' || route.path === '/') { return true }
						else { return false }
					})()">
						<li>
							<RouterLink to="/">
								<span class="text-4xl" :class="route.path === '/' ? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">浏览</span>
							</RouterLink>
						</li>
						<li>
							<RouterLink to="/lucky" :class="route.path === '/lucky'? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">
								<span class="text-4xl">手气不错</span>
							</RouterLink>
						</li>
						<li>
							<RouterLink to="/library" :class="route.path === '/library'? 'font-semibold text-white' : 'text-white/50 hover:text-white/80'">
								<span class="text-4xl">收藏库</span>
							</RouterLink>
						</li>
					</ul>

					<div v-else>
						<button class="text-white w-9 h-9 bg-white/5 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl" @click="$router.back()">
							<div class="w-4 h-4 mx-auto my-auto">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z"></path></svg>
							</div>
						</button>
					</div>

					<div class="flex gap-2">
						<button class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl">
							<div class="w-4 h-4 mx-auto my-auto">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path></svg>
							</div>
						</button>

						<button class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl">
							<div class="w-4 h-4 mx-auto my-auto">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 11.9998C2 11.1353 2.1097 10.2964 2.31595 9.49631C3.40622 9.55283 4.48848 9.01015 5.0718 7.99982C5.65467 6.99025 5.58406 5.78271 4.99121 4.86701C6.18354 3.69529 7.66832 2.82022 9.32603 2.36133C9.8222 3.33385 10.8333 3.99982 12 3.99982C13.1667 3.99982 14.1778 3.33385 14.674 2.36133C16.3317 2.82022 17.8165 3.69529 19.0088 4.86701C18.4159 5.78271 18.3453 6.99025 18.9282 7.99982C19.5115 9.01015 20.5938 9.55283 21.6841 9.49631C21.8903 10.2964 22 11.1353 22 11.9998C22 12.8643 21.8903 13.7032 21.6841 14.5033C20.5938 14.4468 19.5115 14.9895 18.9282 15.9998C18.3453 17.0094 18.4159 18.2169 19.0088 19.1326C17.8165 20.3043 16.3317 21.1794 14.674 21.6383C14.1778 20.6658 13.1667 19.9998 12 19.9998C10.8333 19.9998 9.8222 20.6658 9.32603 21.6383C7.66832 21.1794 6.18354 20.3043 4.99121 19.1326C5.58406 18.2169 5.65467 17.0094 5.0718 15.9998C4.48848 14.9895 3.40622 14.4468 2.31595 14.5033C2.1097 13.7032 2 12.8643 2 11.9998ZM6.80385 14.9998C7.43395 16.0912 7.61458 17.3459 7.36818 18.5236C7.77597 18.8138 8.21005 19.0652 8.66489 19.2741C9.56176 18.4712 10.7392 17.9998 12 17.9998C13.2608 17.9998 14.4382 18.4712 15.3351 19.2741C15.7899 19.0652 16.224 18.8138 16.6318 18.5236C16.3854 17.3459 16.566 16.0912 17.1962 14.9998C17.8262 13.9085 18.8225 13.1248 19.9655 12.7493C19.9884 12.5015 20 12.2516 20 11.9998C20 11.7481 19.9884 11.4981 19.9655 11.2504C18.8225 10.8749 17.8262 10.0912 17.1962 8.99982C16.566 7.90845 16.3854 6.65378 16.6318 5.47605C16.224 5.18588 15.7899 4.93447 15.3351 4.72552C14.4382 5.52844 13.2608 5.99982 12 5.99982C10.7392 5.99982 9.56176 5.52844 8.66489 4.72552C8.21005 4.93447 7.77597 5.18588 7.36818 5.47605C7.61458 6.65378 7.43395 7.90845 6.80385 8.99982C6.17376 10.0912 5.17754 10.8749 4.03451 11.2504C4.01157 11.4981 4 11.7481 4 11.9998C4 12.2516 4.01157 12.5015 4.03451 12.7493C5.17754 13.1248 6.17376 13.9085 6.80385 14.9998ZM12 14.9998C10.3431 14.9998 9 13.6567 9 11.9998C9 10.343 10.3431 8.99982 12 8.99982C13.6569 8.99982 15 10.343 15 11.9998C15 13.6567 13.6569 14.9998 12 14.9998ZM12 12.9998C12.5523 12.9998 13 12.5521 13 11.9998C13 11.4475 12.5523 10.9998 12 10.9998C11.4477 10.9998 11 11.4475 11 11.9998C11 12.5521 11.4477 12.9998 12 12.9998Z"></path></svg>
							</div>
						</button>

						<div class="text-white w-48 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex gap-2 overflow-hidden" v-if="playQueueStore.list.length !== 0">
							<img :src="playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl ?? ''" class="rounded-full" />
							<div class="flex-1 flex items-center">
								<span class="">{{ playQueueStore.list[playQueueStore.currentIndex].song.name }}</span>
							</div>
							<button class="h-9 w-9 flex justify-center items-center" @click="() => {
								playQueueStore.isPlaying = !playQueueStore.isPlaying
							}">
								<div class="w-4 h-4" v-if="playQueueStore.isPlaying">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5H8V19H6V5ZM16 5H18V19H16V5Z"></path></svg>
								</div>
								<div class="w-4 h-4" v-else>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z"></path></svg>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>
			<RouterView />
		</div>
	</div>
</template>