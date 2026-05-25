let Index = {
	name: "Index",
	methods: {
		toOnePage(){
			this.$router.push({ name:"GetPhoto", params:{mode:"onePage"}})
		},
		toTwoPage(){
			this.$router.push({ name: "GetPhoto", params: { mode: "twoPage" } })
		}
	},
	mounted() {
		console.log(this.$router);
		
	},
	template: `
		
		<div class="card bg-white d-flex justify-content-center align-items-center"
			style="width: 25rem;height: 10rem;">
			<button class="btn btn-primary w-50" data-bs-toggle="modal" data-bs-target="#modal">
				Scan Your IC
			</button>
			<hr>
			<p class="text-primary">#Web ini tidak mengambil sebarang data peribadi</p>
		</div>
	
	<div class="modal fade" id="modal">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<p class="h2 text-center">Berapa Page?</p>
				</div>
				<div class="modal-body">
					<div class="d-flex gap-3">

						<button data-bs-dismiss="modal" @click="toOnePage" class="btn w-50 btn-outline-primary py-4">
							<i class="fa-solid fa-id-card me-2"></i>
							1 Page
						</button>

						<button data-bs-dismiss="modal"Q @click="toTwoPage" class="btn w-50 btn-outline-success py-4">
							<i class="fa-solid fa-copy me-2"></i>
							2 Page
						</button>

					</div>
				</div>
			</div>
		</div>
	</div>
	`
}
export default Index