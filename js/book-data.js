/**
 * Dữ liệu sách: Mai và Chuyến Phiêu Lưu Của Những Biển Báo
 * Tác giả: Kim Thanh Lê Huỳnh
 */
const BOOK_DATA = {
  title: "Mai và Chuyến Phiêu Lưu Của Những Biển Báo",
  author: "Kim Thanh Lê Huỳnh",
  totalPages: 10, // 1 Cover + 9 Story spreads
  pages: [
    {
      pageNumber: 1,
      storyIndex: 1,
      leftImage: "assets/pages/story_1_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Hôm nay là một ngày nắng đẹp, cô bé Mai hào hứng dắt chiếc xe đạp màu vàng của mình ra sân. Hôm nay, bác Hùng hàng xóm sẽ dẫn Mai đi dạo phố và dạy cho Mai những \"bí mật\" của các biển báo giao thông để Mai có thể tự tin đi lại an toàn. Mai thắt chặt quai mũ bảo hiểm và sẵn sàng lên đường.",
      audioHint: "Ngày nắng đẹp, bé Mai chuẩn bị dạo phố cùng bác Hùng.",
      hotspots: [
        {
          id: "helmet",
          label: "Mũ bảo hiểm an toàn",
          keywords: ["mũ bảo hiểm", "quai mũ", "thắt chặt"],
          top: "36%",
          left: "52%",
          width: "22%",
          height: "18%",
          type: "pulse-glow",
          soundType: "chime"
        },
        {
          id: "bike",
          label: "Xe đạp màu vàng",
          keywords: ["xe đạp", "màu vàng", "dắt chiếc xe"],
          top: "60%",
          left: "50%",
          width: "28%",
          height: "35%",
          type: "bounce",
          soundType: "ring"
        },
        {
          id: "bachung",
          label: "Bác Hùng hàng xóm",
          keywords: ["bác Hùng", "hàng xóm", "dẫn Mai"],
          top: "24%",
          left: "68%",
          width: "28%",
          height: "46%",
          type: "glow",
          soundType: "chime"
        }
      ]
    },
    {
      pageNumber: 2,
      storyIndex: 2,
      leftImage: "assets/pages/story_2_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Vừa đi được một đoạn, bác Hùng ra hiệu cho Mai dừng lại trước một biển báo hình tam giác màu vàng có hình hai bạn nhỏ đang chạy. Bác Hùng ôn tồn nói: \"Đây là biển báo 'Nguy hiểm có trẻ em' đấy Mai ạ. Khi thấy biển này, các chú lái xe phải đi chậm lại vì gần đây có trường học hoặc sân chơi.\"",
      audioHint: "Biển báo nguy hiểm: chú ý có trẻ em đi qua!",
      hotspots: [
        {
          id: "children-sign",
          label: "Biển báo: Nguy hiểm có trẻ em",
          keywords: ["tam giác màu vàng", "Nguy hiểm có trẻ em", "hai bạn nhỏ"],
          top: "7%",
          left: "28%",
          width: "44%",
          height: "28%",
          type: "alert-pulse",
          soundType: "chime"
        },
        {
          id: "slow-down",
          label: "Đi chậm lại an toàn",
          keywords: ["đi chậm lại", "trường học", "sân chơi"],
          top: "48%",
          left: "34%",
          width: "26%",
          height: "45%",
          type: "bounce",
          soundType: "chime"
        }
      ]
    },
    {
      pageNumber: 3,
      storyIndex: 3,
      leftImage: "assets/pages/story_3_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Đi tới một ngã tư lớn, Mai định rẽ trái để ghé vào tiệm kem nhưng bác Hùng ngăn lại. Bác chỉ vào một biển báo hình tròn có viền đỏ, bên trong có hình mũi tên quẹo trái nhưng bị một vạch đỏ gạch chéo. \"Mai nhìn xem, đây là biển 'Cấm quẹo trái'. Chúng ta không được đi đường này đâu.\"",
      audioHint: "Biển cấm: Không được rẽ trái nhé!",
      hotspots: [
        {
          id: "no-left-turn",
          label: "Biển báo: Cấm quẹo trái",
          keywords: ["hình tròn có viền đỏ", "Cấm quẹo trái", "gạch chéo", "mũi tên quẹo trái"],
          top: "3%",
          left: "8%",
          width: "45%",
          height: "30%",
          type: "alert-shake",
          soundType: "alert"
        },
        {
          id: "ice-cream-stop",
          label: "Bác Hùng nhắc nhở dừng lại",
          keywords: ["ngăn lại", "tiệm kem", "không được đi"],
          top: "18%",
          left: "22%",
          width: "50%",
          height: "52%",
          type: "glow",
          soundType: "chime"
        }
      ]
    },
    {
      pageNumber: 4,
      storyIndex: 4,
      leftImage: "assets/pages/story_4_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Mai gật đầu hiểu ý. Cô bé cùng bác Hùng tiếp tục đạp xe đi thẳng. Mai nhận ra rằng nếu mình chú ý quan sát biển báo, mình sẽ biết cách đi đúng đường và không làm ảnh hưởng đến các phương tiện khác. \"Ồ, hóa ra biển báo giống như những người chỉ đường thầm lặng bác nhỉ!\" Mai reo lên.",
      audioHint: "Biển báo như những người chỉ đường thầm lặng.",
      hotspots: [
        {
          id: "bike-together",
          label: "Cùng nhau đạp xe đi thẳng",
          keywords: ["tiếp tục đạp xe", "đi thẳng", "đúng đường"],
          top: "28%",
          left: "20%",
          width: "70%",
          height: "65%",
          type: "ride-along",
          soundType: "ring"
        },
        {
          id: "silent-guide",
          label: "Người chỉ đường thầm lặng",
          keywords: ["người chỉ đường thầm lặng", "biển báo", "Mai reo lên"],
          top: "5%",
          left: "10%",
          width: "80%",
          height: "30%",
          type: "stars-sparkle",
          soundType: "chime"
        }
      ]
    },
    {
      pageNumber: 5,
      storyIndex: 5,
      leftImage: "assets/pages/story_5_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Sau đó, hai bác cháu đi ngang qua một làn đường rộng hơn. Ở đó có một biển báo hình tròn màu xanh lục, bên trong có hình một chiếc xe ô tô màu trắng. Bác Hùng giải thích: \"Đây là biển 'Ưu tiên xe ô tô'. Ở làn đường này, xe ô tô được ưu tiên đi, nên xe đạp của Mai mình nên đi sát vào lề đường bên phải cho an toàn nhé.\"",
      audioHint: "Biển xanh: Làn đường ưu tiên cho xe ô tô.",
      hotspots: [
        {
          id: "car-priority-sign",
          label: "Biển báo: Ưu tiên xe ô tô",
          keywords: ["màu xanh lục", "Ưu tiên xe ô tô", "xe ô tô màu trắng"],
          top: "1%",
          left: "1%",
          width: "46%",
          height: "36%",
          type: "green-glow",
          soundType: "chime"
        },
        {
          id: "car-passing",
          label: "Xe ô tô di chuyển",
          keywords: ["xe ô tô được ưu tiên", "làn đường rộng"],
          top: "35%",
          left: "40%",
          width: "30%",
          height: "18%",
          type: "car-glide",
          soundType: "car"
        },
        {
          id: "stay-right",
          label: "Đi sát lề đường bên phải",
          keywords: ["sát vào lề đường bên phải", "cho an toàn"],
          top: "45%",
          left: "35%",
          width: "55%",
          height: "50%",
          type: "pulse-glow",
          soundType: "ring"
        }
      ]
    },
    {
      pageNumber: 6,
      storyIndex: 6,
      leftImage: "assets/pages/story_6_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Đang đi, Mai thấy một biển báo hình tròn viền đỏ, ở giữa có số '40' rất lớn. Mai thắc mắc: \"Số 40 này có nghĩa là gì vậy bác Hùng?\". Bác Hùng cười: \"Đó là biển báo 'Tốc độ cho phép tối đa là 40 km/h'. Các xe không được đi nhanh hơn con số này để đảm bảo mọi người trên đường đều an toàn.\"",
      audioHint: "Biển báo tốc độ: Tối đa 40 km/h.",
      hotspots: [
        {
          id: "speed-limit-40",
          label: "Biển báo: Tốc độ tối đa 40 km/h",
          keywords: ["số '40'", "40 km/h", "Tốc độ cho phép tối đa", "hình tròn viền đỏ"],
          top: "1%",
          left: "1%",
          width: "36%",
          height: "32%",
          type: "heartbeat-pulse",
          soundType: "alert"
        },
        {
          id: "mai-wonder",
          label: "Mai hỏi về ý nghĩa biển báo",
          keywords: ["Mai thắc mắc", "bác Hùng cười"],
          top: "35%",
          left: "20%",
          width: "60%",
          height: "55%",
          type: "glow",
          soundType: "chime"
        }
      ]
    },
    {
      pageNumber: 7,
      storyIndex: 7,
      leftImage: "assets/pages/story_7_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Mai quan sát các chú tài xế trên đường. Đúng thật, các xe đều đi rất thong thả, không ai phóng nhanh vượt ẩu cả. Mai cảm thấy yên tâm hơn hẳn khi hiểu được ý nghĩa của con số 40 kỳ diệu đó. Cô bé tự nhủ khi lớn lên lái xe, mình cũng sẽ tuân thủ tốc độ như thế.",
      audioHint: "Tất cả mọi người cùng đi thong thả và an toàn.",
      hotspots: [
        {
          id: "calm-traffic",
          label: "Xe cộ di chuyển thong thả",
          keywords: ["rất thong thả", "phóng nhanh", "các chú tài xế", "các xe đều đi"],
          top: "26%",
          left: "1%",
          width: "65%",
          height: "26%",
          type: "calm-wave",
          soundType: "car"
        },
        {
          id: "peace-of-mind",
          label: "Bé Mai yên tâm và tự hào",
          keywords: ["yên tâm hơn", "con số 40 kỳ diệu", "tuân thủ tốc độ"],
          top: "45%",
          left: "10%",
          width: "48%",
          height: "50%",
          type: "pulse-glow",
          soundType: "chime"
        }
      ]
    },
    {
      pageNumber: 8,
      storyIndex: 8,
      leftImage: "assets/pages/story_8_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Cuối cùng, hai bác cháu cũng đến được công viên xanh mát. Mai cảm thấy rất tự hào vì hôm nay mình đã học được bao nhiêu điều bổ ích. Những biển báo không còn là những hình vẽ lạ lẫm nữa, mà chúng đã trở thành những người bạn giúp Mai đi đường an toàn.",
      audioHint: "Đến công viên xanh mát, kết thúc hành trình vui vẻ!",
      hotspots: [
        {
          id: "green-park-gate",
          label: "Cổng công viên The Green Park",
          keywords: ["công viên xanh mát", "The Green Park"],
          top: "3%",
          left: "12%",
          width: "75%",
          height: "20%",
          type: "leaf-fall",
          soundType: "chime"
        },
        {
          id: "water-bottle",
          label: "Bác Hùng đưa chai nước mát",
          keywords: ["hai bác cháu", "bổ ích", "những người bạn", "an toàn"],
          top: "45%",
          left: "40%",
          width: "45%",
          height: "40%",
          type: "water-sparkle",
          soundType: "chime"
        }
      ]
    },
    {
      pageNumber: 9,
      storyIndex: 9,
      leftImage: "assets/pages/story_9_left.jpg",
      header: "KIM THANH LÊ HUỲNH",
      text: "Ngồi nghỉ trên ghế đá, Mai say sưa kể lại cho bác Hùng nghe về những biển báo mình vừa học. Bác Hùng gật đầu tán thưởng và nhắc Mai rằng việc hiểu biển báo chính là cách tốt nhất để bảo vệ bản thân và mọi người xung quanh. Mai mỉm cười, cảm thấy mình đã trưởng thành hơn một chút.",
      audioHint: "Hiểu biển báo là bảo vệ bản thân và mọi người.",
      hotspots: [
        {
          id: "mini-signs",
          label: "Hai biển báo mini trên tay Mai",
          keywords: ["biển báo mình vừa học", "ghế đá", "say sưa kể lại"],
          top: "45%",
          left: "12%",
          width: "45%",
          height: "35%",
          type: "signs-juggle",
          soundType: "chime"
        },
        {
          id: "grow-up",
          label: "Mai đã trưởng thành hơn!",
          keywords: ["bảo vệ bản thân", "mọi người xung quanh", "trưởng thành hơn", "mỉm cười"],
          top: "10%",
          left: "5%",
          width: "90%",
          height: "85%",
          type: "celebrate-confetti",
          soundType: "fanfare"
        }
      ]
    }
  ]
};
