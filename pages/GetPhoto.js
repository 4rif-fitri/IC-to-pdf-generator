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

		// --- FUNGSI 1: KHUSUS UNTUK BUKA KAMERA SAHAJA ---
		bukaKameraMati() {
			return new Promise((resolve, reject) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/*";
				input.capture = "environment"; // Paksa buka kamera belakang telefon

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

		// --- FUNGSI 2: KHUSUS UNTUK BUKA GALERI SAHAJA ---
		bukaGaleriMati() {
			return new Promise((resolve, reject) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = "image/jpeg, image/png"; // Fokus kepada fail imej di storan

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

		// --- LOGIK UTAMA MENGURUSKAN FAIL YANG DIPILIH ---
		async prosesGambar(sumber) {
			try {
				let file;

				// Tentukan fungsi mana yang patut dipanggil berdasarkan butang yang ditekan
				if (sumber === 'kamera') {
					file = await this.bukaKameraMati();
				} else {
					file = await this.bukaGaleriMati();
				}

				// Olah gambar ke canvas & hadkan tinggi
				let base64Image = await this.drawImageToCanvas(file);

				// Masukkan ke dalam array
				this.arrayPhotoData.push(base64Image);
				this.photoCountCurrent++;

				console.log(`Gambar ${this.photoCountCurrent}/${this.photoCount} berjaya diproses.`);

				// Semak had maksimum gambar
				if (this.photoCountCurrent >= this.photoCount) {
					console.log("Semua gambar selesai, hantar ke EDIT:", this.arrayPhotoData);
					const rawArray = JSON.parse(JSON.stringify(this.arrayPhotoData));

					this.$router.push({
						name: "Edit",
						state: { PhotoData: rawArray }
					});
				} else {
					alert(`Sila masukkan ${this.photoCount - this.photoCountCurrent} gambar lagi.`);
				}

			} catch (error) {
				console.error("User batalkan tindakan atau ralat berlaku:", error);
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
                    <h3 class="mb-4">Sesi Ambil Gambar ({{ photoCountCurrent }} / {{ photoCount }})</h3>
                    
                    <div class="d-flex flex-column gap-3 max-width-mobile mx-auto" style="max-width: 340px;">
                         
                         <button class="btn btn-primary btn-lg py-3 rounded-3 shadow-sm" @click="prosesGambar('kamera')">
                              <i class="fa-solid fa-camera me-2"></i> Ambil Dari Kamera
                         </button>
                         
                         <button class="btn btn-success btn-lg py-3 rounded-3 shadow-sm" @click="prosesGambar('galeri')">
                              <i class="fa-solid fa-images me-2"></i> Ambil Dari Galeri
                         </button>

                    </div>
				
                    <div class="mt-4 text-muted small" v-if="photoCountCurrent < photoCount">
                         Sila lengkapkan {{ photoCount }} keping gambar untuk meneruskan proses suntingan.
                    </div>

               </div>
          </div>
     `
}

export default GetPhoto;