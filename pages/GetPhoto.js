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

				img.src = URL.createObjectURL(file);

				img.onload = () => {
					// === TETAPAN HAD TINGGI (LIMIT HEIGHT) DI SINI ===
					const MAX_HEIGHT = 1280; // Anda boleh tukar had tinggi piksel di sini (cth: 1080, 1280, 1920)
					let targetWidth = img.width;
					let targetHeight = img.height;

					// Jika tinggi gambar melebihi had, kecilkan skala secara sekata (maintain aspect ratio)
					if (img.height > MAX_HEIGHT) {
						const ratio = MAX_HEIGHT / img.height;
						targetHeight = MAX_HEIGHT;
						targetWidth = img.width * ratio;
						console.log(`Tinggi imej asal (${img.height}px) melebihi had. Skala dikecilkan ke: ${targetWidth}px x ${targetHeight}px`);
					}

					// Set dimensi canvas mengikut saiz baharu yang telah dihadkan
					canvas.width = targetWidth;
					canvas.height = targetHeight;

					// Aktifkan kualiti penataan imej yang tinggi
					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = "high";

					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					// Ekstrak imej ke bentuk Base64 dengan kualiti maksimum (1.0)
					const dataUrl = canvas.toDataURL("image/jpeg", 1.0);

					// Lepaskan memori SEBELUM resolve
					URL.revokeObjectURL(img.src);

					// Pulangkan string Base64
					resolve(dataUrl);
				};
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

				// 2. Tunggu proses olah gambar ke canvas selesai (Serta dihadkan tinggi)
				let base64Image = await this.drawImageToCanvas(file);

				// 3. Masukkan ke dalam array mengikut indeks semasa
				this.arrayPhotoData.push(base64Image);

				// 4. Naikkan kaunter semasa
				this.photoCountCurrent++;

				console.log(`Gambar ${this.photoCountCurrent}/${this.photoCount} berjaya diambil.`);

				// 5. Semak jika jumlah gambar sudah mencukupi had
				if (this.photoCountCurrent >= this.photoCount) {
					console.log("Semua gambar selesai diambil, bersiap sedia untuk hantar ke EDIT:", this.arrayPhotoData);

					// BERSIHKAN PROXY DI SINI sebelum hantar
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
          <div class="container text-center p-4">
			<div class="sss">
		<div class="outline">

		</div>
		<div class="ic">

		</div>
	</div>
               <h3 class="mb-3">Ambil Gambar Secara MENEGAK</h3>
               <h3 class="mb-3">Gambar ({{ photoCountCurrent }} / {{ photoCount }})</h3>
               
               <button class="btn btn-primary btn-lg" @click="getPhoto">
                    <i class="fa-solid fa-camera me-2"></i> Ambil Gambar
               </button>

               <div class="mt-3 text-muted" v-if="photoCountCurrent < photoCount">
                    Sila ambil gambar sehingga cukup {{ photoCount }} keping untuk dihantar.
               </div>
          </div>
     `
}
export default GetPhoto;