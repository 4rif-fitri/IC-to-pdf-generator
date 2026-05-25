let Edit = {
	name: "Edit",
	data() {
		return {
			senaraiGambar: [],
			cropperInstance: null,
			indexGambarSedangDiedit: null
		}
	},
	async mounted() {
		if (history.state && history.state.PhotoData) {
			// Map data awal gambar
			const dataMentah = history.state.PhotoData.map(imgStr => {
				return {
					src: imgStr,
					croppedSrc: null, // Akan diisi oleh auto crop di bawah
					rotation: 0,
					isGrayscale: true, // === AUTO SELECT HITAM PUTIH DI SINI ===
					pdfWidthFactor: 0.40 // Default 40%
				}
			});

			// Lakukan proses auto-crop pada setiap gambar secara automatik semasa preview
			for (let i = 0; i < dataMentah.length; i++) {
				try {
					dataMentah[i].croppedSrc = await this.autoCropKeSaizIC(dataMentah[i].src);
				} catch (err) {
					console.error("Gagal melakukan auto-crop pada gambar indeks " + i, err);
					dataMentah[i].croppedSrc = dataMentah[i].src; // Fallback guna gambar asal jika gagal
				}
			}

			this.senaraiGambar = dataMentah;
			console.log("Data gambar berjaya di auto-crop untuk halaman Preview:", this.senaraiGambar);
		} else {
			console.warn("Tiada data gambar yang diterima.");
		}
	},
	methods: {
		// --- LOGIK: AUTO CROP SECARA SENYAP MENGGUNAKAN CANVAS (NISBAH IC 110/70) ---
		autoCropKeSaizIC(src) {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.src = src;
				img.onload = () => {
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");

					const targetRatio = 110 / 70; // Nisbah IC tulen anda
					let sourceX = 0;
					let sourceY = 0;
					let sourceWidth = img.width;
					let sourceHeight = img.height;

					// Kira ukuran pemotongan di bahagian tengah gambar (Center Crop)
					if (img.width / img.height > targetRatio) {
						// Gambar terlalu lebar, potong bahagian kiri dan kanan
						sourceWidth = img.height * targetRatio;
						sourceX = (img.width - sourceWidth) / 2;
					} else {
						// Gambar terlalu tinggi, potong bahagian atas dan bawah
						sourceHeight = img.width / targetRatio;
						sourceY = (img.height - sourceHeight) / 2;
					}

					// Set ukuran output canvas mengikut saiz kawasan yang dipotong
					canvas.width = sourceWidth;
					canvas.height = sourceHeight;

					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = "high";

					// Lukis bahagian tengah gambar sahaja ke dalam canvas
					ctx.drawImage(
						img,
						sourceX, sourceY, sourceWidth, sourceHeight, // Koordinat asal gambar
						0, 0, sourceWidth, sourceHeight              // Koordinat canvas destinasi
					);

					// Pulangkan hasil potongan dalam kualiti 100%
					resolve(canvas.toDataURL("image/jpeg", 1.0));
				};
				img.onerror = (err) => reject(err);
			});
		},

		// --- KUMPULAN FUNGSI CROPPER.JS (PENGGUNA MASIH BOLEH ADJUST MANUAL) ---
		bukaModalCrop(index) {
			this.indexGambarSedangDiedit = index;
			const gbr = this.senaraiGambar[index];

			const imejModal = document.getElementById("imageToCrop");
			// Tukar fokus kepada gambar asal (.src) bukannya gambar yang dah di-crop supaya user boleh laras semula
			imejModal.src = gbr.src;

			imejModal.style.width = '100%';
			imejModal.style.height = 'auto';

			$('#cropModal').off('shown.bs.modal');
			$('#cropModal').on('shown.bs.modal', () => {
				if (this.cropperInstance) {
					this.cropperInstance.destroy();
				}

				const self = this;
				this.cropperInstance = new Cropper(imejModal, {
					viewMode: 1,
					dragMode: 'move',
					autoCropArea: 0.85,
					aspectRatio: 110 / 70, // Kekalkan nisbah IC semasa pelarasan manual
					responsive: true,
					restore: false,
					ready() {
						self.cropperInstance.crop();
					}
				});
			});

			$('#cropModal').modal('show');
		},

		selesaiCrop() {
			if (!this.cropperInstance) return;

			const canvasDipotong = this.cropperInstance.getCroppedCanvas({
				imageSmoothingEnabled: true,
				imageSmoothingQuality: 'high'
			});

			const hasilBase64 = canvasDipotong.toDataURL("image/jpeg", 1.0);

			// Kemas kini croppedSrc dengan hasil potongan manual pengguna
			this.senaraiGambar[this.indexGambarSedangDiedit].croppedSrc = hasilBase64;

			$('#cropModal').modal('hide');
			this.cropperInstance.destroy();
			this.cropperInstance = null;
		},

		// --- KUMPULAN FUNGSI ASAS EDIT ---
		putarGambar(index) {
			this.senaraiGambar[index].rotation = (this.senaraiGambar[index].rotation + 90) % 360;
		},

		tukarHitamPutih(index) {
			this.senaraiGambar[index].isGrayscale = !this.senaraiGambar[index].isGrayscale;
		},

		// --- LOGIK PEMBINAAN DOKUMEN PDF A4 TULEN (HIGH RESOLUTION 100%) ---
		async janaPdf() {
			if (this.senaraiGambar.length === 0) {
				alert("Tiada gambar untuk dijana!");
				return;
			}

			const scale = 4;
			const a4Width = 595 * scale;
			const a4Height = 842 * scale;

			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.width = a4Width;
			canvas.height = a4Height;

			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = "high";

			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(0, 0, a4Width, a4Height);

			const jumlahGambar = Math.min(this.senaraiGambar.length, 2);

			for (let i = 0; i < jumlahGambar; i++) {
				const gbr = this.senaraiGambar[i];

				const imejPilihan = gbr.croppedSrc ? gbr.croppedSrc : gbr.src;
				const img = await this.loadImage(imejPilihan);

				const maxImgWidth = a4Width * gbr.pdfWidthFactor;
				const maxImgHeight = (a4Height / 2) - (40 * scale);

				let ratio = Math.min(maxImgWidth / img.width, maxImgHeight / img.height);
				let newWidth = img.width * ratio;
				let newHeight = img.height * ratio;

				let targetX = a4Width / 2;
				let targetY = (jumlahGambar === 1) ? (a4Height / 2) : ((i === 0) ? (a4Height / 4) : (a4Height * 0.75));

				ctx.save();
				ctx.translate(targetX, targetY);
				ctx.rotate((gbr.rotation * Math.PI) / 180);
				ctx.drawImage(img, -newWidth / 2, -newHeight / 2, newWidth, newHeight);
				ctx.restore();

				if (gbr.isGrayscale) {
					const startX = targetX - (newWidth / 2);
					const startY = targetY - (newHeight / 2);

					const imgData = ctx.getImageData(startX, startY, newWidth, newHeight);
					const data = imgData.data;

					for (let j = 0; j < data.length; j += 4) {
						let brightness = 0.34 * data[j] + 0.5 * data[j + 1] + 0.16 * data[j + 2];
						data[j] = brightness;
						data[j + 1] = brightness;
						data[j + 2] = brightness;
					}
					ctx.putImageData(imgData, startX, startY);
				}
			}

			const a4Base64 = canvas.toDataURL("image/jpeg", 1.0);

			const { jsPDF } = window.jspdf;
			const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

			pdf.addImage(a4Base64, "JPEG", 0, 0, 595, 842, undefined, 'FAST');
			pdf.save("Dokumen_A4_HD.pdf");
		},

		loadImage(src) {
			return new Promise((resolve) => {
				const img = new Image();
				img.src = src;
				img.onload = () => resolve(img);
			});
		}
	},
	template: `
          <div class="container-fluid p-3 asd">
               <div class="card shadow-sm mt-5 border-0">
                    <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center rounded-0">
                         <h5 class="mb-0"><i class="fa-solid fa-scissors me-2"></i> Edit & Potong Gambar</h5>
                         <router-link to="/" class="btn btn-sm btn-outline-light">
                              <i class="fa-solid fa-house me-1"></i> Utama
                         </router-link>
                    </div>
                    <div class="card-body bg-light p-2">
                         
                         <div v-if="senaraiGambar.length > 0">
                              
                              <div class="col gap-2">
                                   <div v-for="(gbr, index) in senaraiGambar" :key="index" class="w-100">
                                        <div class="card p-3 border-0 shadow-sm rounded-3 mt-3">
                                             
                                             <div class="d-flex justify-content-between align-items-center mb-2">
                                                  <span class="badge bg-secondary p-2">Gambar {{ index + 1 }}</span>
                                             </div>

                                             <div class="d-flex justify-content-center align-items-center rounded-3 p-2" 
                                                  style="width: 100%; min-height: 200px; overflow: hidden; background-color: #f5f5f5;">
                                                  <img :src="gbr.croppedSrc ? gbr.croppedSrc : gbr.src" 
                                                       class="img-fluid" 
                                                       :style="{ 
                                                            transform: 'rotate(' + gbr.rotation + 'deg)', 
                                                            filter: gbr.isGrayscale ? 'grayscale(100%)' : 'none',
                                                            maxWidth: (gbr.rotation % 180 !== 0) ? '420px' : '100%',
                                                            maxHeight: (gbr.rotation % 180 !== 0) ? '100%' : 'none',
                                                            height: 'auto',
                                                            objectFit: 'contain',
                                                            transition: 'transform 0.2s ease'
                                                       }" />
                                             </div>
                                             
                                             <div class="mt-3 p-2 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                                                  <label class="small text-dark mb-0 fw-bold">
                                                       <i class="fa-solid fa-arrows-left-right me-1 text-secondary"></i> Skala Lebar Fail (A4):
                                                  </label>
                                                  <select v-model.number="gbr.pdfWidthFactor" class="form-select form-select-sm" style="width: 140px;">
                                                       <option :value="0.10">10% Width</option>
                                                       <option :value="0.20">20% Width</option>
                                                       <option :value="0.30">30% Width</option>
                                                       <option :value="0.40">40% Width</option>
                                                       <option :value="0.50">50% Width</option>
                                                       <option :value="0.70">70% Width</option>
                                                       <option :value="0.90">90% Width</option>
                                                       <option :value="1.00">100% Full</option>
                                                  </select>
                                             </div>

                                             <div class="mt-2">
                                                  <div class="d-flex justify-content-between gap-2">
                                                       <button @click="bukaModalCrop(index)" class="btn btn-primary flex-fill py-2">
                                                            <i class="fa-solid fa-crop me-1"></i> Crop
                                                       </button>
                                                       <button @click="tukarHitamPutih(index)" 
                                                               :class="['btn flex-fill py-2', gbr.isGrayscale ? 'btn-dark' : 'btn-outline-dark']">
                                                            <i class="fa-solid fa-circle-half-stroke me-1"></i> B&W
                                                       </button>
                                                  </div>
                                             </div>

                                        </div>
                                   </div>
                              </div>

                              <div class="p-2 mt-4">
                                   <button @click="janaPdf" class="btn btn-success btn-lg w-100 py-3 shadow border-0 rounded-3">
                                        <i class="fa-solid fa-file-pdf me-2"></i> Gabung & Download PDF A4
                                   </button>
                              </div>
                         </div>

                         <div v-else class="p-5 text-center text-muted">
                              <i class="fa-solid fa-folder-open fa-2x mb-2"></i>
                              <p>Tiada data gambar ditemui.</p>
                         </div>

                    </div>
               </div>

               <div class="modal fade" id="cropModal" data-bs-backdrop="static" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-centered"> 
                         <div class="modal-content border-0 shadow-lg rounded-3">
                              <div class="modal-header bg-dark text-white">
                                   <h5 class="modal-title"><i class="fa-solid fa-crop-simple me-2"></i>Laras Kotak Potongan</h5>
                                   <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                              </div>
                              
                              <div class="modal-body bg-secondary p-1" style="max-height: 80vh; overflow: auto;">
                                   <div class="img-container bg-black d-flex justify-content-center align-items-center" style="min-height: 400px;">
                                        <img id="imageToCrop" style="max-width: 100%; max-height: 75vh; display: block;">
                                   </div>
                              </div>
                              
                              <div class="modal-footer bg-light">
                                   <button type="button" class="btn btn-secondary py-2 px-4" data-bs-dismiss="modal">Batal</button>
                                   <button type="button" @click="selesaiCrop" class="btn btn-success py-2 px-4 shadow-sm">
                                        <i class="fa-solid fa-check me-1"></i> Selesai Crop
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>

          </div>
     `
}

export default Edit;