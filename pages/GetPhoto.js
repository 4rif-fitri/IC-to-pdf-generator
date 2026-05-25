let GetPhoto = {
	name: "GetPhoto",
	data() {
		return {
			// Jika mode == "onePage", had ialah 1 gambar. Jika tidak, 2 gambar.
			photoCount: this.$route.params.mode === "onePage" ? 1 : 2,
			photoCountCurrent: 0,
			arrayPhotoData: [],
			imageUrl: null,
		}
	},
	methods: {
		// Fungsi pemprosesan canvas dengan tetapan HAD TINGGI MAKSIMUM
		drawImageToCanvas(file) {
			return new Promise((resolve) => {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				const img = new Image();

				const objectUrl = URL.createObjectURL(file);

				img.onload = () => {
					let originalWidth = img.naturalWidth || img.width;
					let originalHeight = img.naturalHeight || img.height;

					// Kawalan had tinggi maksimum imej
					const MAX_HEIGHT = 1280;
					let targetWidth = originalWidth;
					let targetHeight = originalHeight;

					if (originalHeight > MAX_HEIGHT) {
						const ratio = MAX_HEIGHT / originalHeight;
						targetHeight = MAX_HEIGHT;
						targetWidth = originalWidth * ratio;
						console.log(`[PROSES] Saiz asal: ${originalWidth}x${originalHeight}. Had tinggi aktif! Saiz baharu: ${targetWidth}x${targetHeight}`);
					} else {
						console.log(`[PROSES] Saiz imej (${originalHeight}px) di bawah had tinggi.`);
					}

					canvas.width = targetWidth;
					canvas.height = targetHeight;

					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = "high";

					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

					const dataUrl = canvas.toDataURL("image/jpeg", 1.0);

					URL.revokeObjectURL(objectUrl);
					resolve(dataUrl);
				};

				img.src = objectUrl;
			});
		},

		async openCamera() {
			return await new Promise((resolve, reject) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/*";
				input.capture = "environment";

				input.onchange = (event) => {
					const file = event.target.files[0];
					if (!file) {
						reject("No file selected");
						return;
					}
					resolve(file);
				};

				input.click();
			});
		},

		async getPhoto() {
			try {
				// 1. Tunggu gambar diambil dari kamera
				let file = await this.openCamera();

				// 2. Tunggu proses olah gambar ke canvas selesai
				let base64Image = await this.drawImageToCanvas(file);

				// 3. Masukkan ke dalam array mengikut indeks semasa
				this.arrayPhotoData.push(base64Image);

				// 4. Naikkan kaunter semasa
				this.photoCountCurrent++;

				console.log(`Gambar ${this.photoCountCurrent}/${this.photoCount} berjaya diambil.`);

				// 5. Semak jika jumlah gambar sudah mencukupi had
				if (this.photoCountCurrent >= this.photoCount) {
					console.log("Semua gambar selesai diambil, bersiap sedia untuk hantar ke EDIT:", this.arrayPhotoData);

					const rawArray = JSON.parse(JSON.stringify(this.arrayPhotoData));

					// Navigasi ke page Edit
					this.$router.push({
						name: "Edit",
						state: { PhotoData: rawArray }
					});
				} else {
					alert(`Sila ambil ${this.photoCount - this.photoCountCurrent} gambar lagi.`);
				}

			} catch (error) {
				console.error("User batalkan tangkap gambar atau ralat berlaku:", error);
			}
		}
	},
	async mounted() {
		console.log("Had keperluan gambar untuk sesi ini:", this.photoCount);
	},
	template: `
          <div>
               <div class="container text-center p-4">
                    <div class="sss">
                         <div class="outline"></div>
                         <div class="ic"></div>
                    </div>
               </div>

               <div class="container text-center p-4">
                    <h3 class="mb-3">Sesi Tangkap Gambar ({{ photoCountCurrent }} / {{ photoCount }})</h3>
                    
                    <button class="btn btn-primary btn-lg" @click="getPhoto">
                         <i class="fa-solid fa-camera me-2"></i> Ambil Gambar
                    </button>

                    <div class="mt-3 text-muted" v-if="photoCountCurrent < photoCount">
                         Sila ambil gambar sehingga cukup {{ photoCount }} keping untuk dihantar.
                    </div>
               </div>
          </div>
     `
}

export default GetPhoto;