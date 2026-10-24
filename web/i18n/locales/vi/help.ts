export default {
  title: 'Hướng dẫn sử dụng',
  description: 'Mỗi bài có vài bước ngắn, có hình chụp thật. Số màu cam trên hình chỉ đúng chỗ cần bấm. Nếu mới dùng, hãy bắt đầu từ bài 1.',
  stepCount: '{count} bước',
  lessonNumber: 'Bài {number}',
  stepNumber: 'Bước {number}',
  tip: 'Mẹo',
  topicsLabel: 'Các bài hướng dẫn',
  previous: 'Bài trước',
  next: 'Bài tiếp theo',
  backToList: 'Tất cả bài hướng dẫn',
  imageAlt: 'Hình minh họa: {title}',
  zoom: 'Bấm vào hình để xem toàn màn hình (bấm lại hoặc Esc để thoát)',
  audience: {
    editors: 'Cho người được sửa',
    admins: 'Cho quản trị viên',
  },
  topics: {
    start: {
      title: 'Bắt đầu',
      summary: 'Đăng nhập và tìm đường đi trong Origo.',
      steps: {
        login: {
          title: 'Đăng nhập',
          text: 'Gõ email của bạn vào ô số 1. Gõ mật khẩu vào ô số 2. Bấm nút số 3 để vào.',
          tip: 'Quên mật khẩu? Nhờ người quản trị đặt lại mật khẩu cho bạn.',
        },
        home: {
          title: 'Chọn một ô to',
          text: 'Vào rồi, bạn thấy các ô vuông to. Mỗi ô là một khu. Bấm ô Dự án (số 1) để làm việc với dự án. Bấm ô Hướng dẫn (số 2) để đọc lại trang này.',
        },
        launcher: {
          title: 'Nút chín chấm',
          text: 'Ở góc trên bên trái có nút chín chấm (số 1). Bấm vào là hiện lại các ô (số 2), dù bạn đang ở trang nào.',
        },
        bell: {
          title: 'Cái chuông',
          text: 'Cái chuông (số 1) có số đỏ khi có tin mới: ai đó gắn tên bạn, thêm bạn vào dự án, đổi vai trò của bạn hoặc giao lịch cho bạn. Bấm vào chuông để xem danh sách (số 2), bấm một tin để mở đúng chỗ.',
        },
      },
    },
    projects: {
      title: 'Dự án',
      summary: 'Tìm dự án của bạn, mở từng phần và sửa thông tin dự án.',
      steps: {
        list: {
          title: 'Tìm dự án của bạn',
          text: 'Trang Dự án có một thẻ cho mỗi dự án bạn tham gia. Tên dự án ở số 1. Số 2 cho biết người quản lý, số thành viên và số màn hình. Ở thanh trên cùng, gõ để tìm, chọn Đang hoạt động hoặc Đã lưu trữ, và đổi giữa dạng lưới hoặc danh sách.',
          tip: 'Trình duyệt nhớ bạn thích xem dạng lưới hay danh sách.',
        },
        open: {
          title: 'Mở một phần của dự án',
          text: 'Mỗi thẻ có các nút ở số 1: Kế hoạch, Thiết kế, Thành viên. Bấm nút nào thì mở phần đó.',
        },
        tabs: {
          title: 'Đổi qua lại các phần',
          text: 'Khi đã vào dự án, hàng nút số 1 giúp bạn đổi giữa Kế hoạch, Thiết kế, Thành viên và Thông tin.',
        },
        info: {
          title: 'Sửa tên và mô tả dự án',
          text: 'Bấm Thông tin (số 1). Sửa tên dự án hoặc mô tả (số 2) rồi bấm Lưu. Mã dự án thì không đổi được.',
          tip: 'Chỉ Quản lý dự án hoặc quản trị viên mới sửa được. Người khác chỉ xem.',
        },
        archive: {
          title: 'Lưu trữ hoặc xóa dự án',
          text: 'Ở trang Thông tin, phần Vùng nguy hiểm (số 1): Lưu trữ để dự án chỉ còn xem; Xóa hoàn toàn để xóa hẳn. Máy bắt gõ đúng mã dự án rồi mới cho bấm.',
          tip: 'Lưu trữ mở lại được. Xóa hoàn toàn thì không lấy lại được, và chỉ quản trị viên mới làm được.',
        },
      },
    },
    'plan-read': {
      title: 'Đọc kế hoạch',
      summary: 'Hiểu biểu đồ: dòng, thanh màu, ngày hôm nay và chỗ đã xong.',
      steps: {
        rows: {
          title: 'Mỗi dòng là một việc',
          text: 'Bên trái là tên việc (số 1). Bên phải là thanh màu (số 2): thanh dài từ ngày bắt đầu tới ngày xong. Vạch đỏ (số 3) là hôm nay.',
        },
        legend: {
          title: 'Mỗi màu là một giai đoạn',
          text: 'Ví dụ tím là Thiết kế cơ bản, xanh đậm là Phát triển. Xem bảng màu ở số 1 để biết màu nào là giai đoạn nào.',
        },
        done: {
          title: 'Màu xanh lá là xong rồi',
          text: 'Khi mọi việc trong một dòng đã xong, cả dòng chuyển xanh lá và có dấu ✓ (số 1). Nhìn là biết chỗ nào làm xong.',
        },
        toolbar: {
          title: 'Thanh công cụ',
          text: 'Số 1: đổi giữa Biểu đồ và Bảng. Số 2: phóng to hoặc thu nhỏ. Số 3: nhảy về hôm nay. Số 4: xem toàn màn hình.',
          tip: 'Toàn màn hình rất hợp khi chiếu cho cả nhóm xem. Nhấn Esc để thoát.',
        },
        filter: {
          title: 'Lọc cho dễ tìm',
          text: 'Gõ tên vào ô tìm (số 1), chọn người phụ trách (số 2) hoặc bấm trạng thái (số 3) để chỉ hiện những gì cần xem. Chọn “Của tôi” để thấy việc của mình. Bộ lọc dùng cho cả Biểu đồ và Bảng; bấm “Bỏ lọc” để xem lại tất cả.',
        },
        details: {
          title: 'Xem chi tiết một việc',
          text: 'Bấm vào tên một dòng. Bên phải hiện ô chi tiết: tên việc (số 1) và lịch của từng giai đoạn (số 2). Bấm vào một thanh màu (hoặc một ô ngày trong Bảng) thì chỉ hiện đúng giai đoạn đó, có sẵn ô để sửa; bấm “Xem toàn bộ việc” để xem lại tất cả.',
        },
      },
    },
    'plan-edit': {
      title: 'Sửa kế hoạch',
      summary: 'Kéo thanh để đổi ngày, đổi trạng thái, đổi thứ tự và ghi chú.',
      steps: {
        move: {
          title: 'Dời cả thanh',
          text: 'Bấm giữ vào giữa thanh màu rồi kéo sang trái hoặc phải. Thả tay ra là lưu luôn.',
          tip: 'Chỉ Quản lý dự án và BA mới sửa được kế hoạch. Người khác chỉ xem.',
        },
        resize: {
          title: 'Đổi ngày bắt đầu, ngày xong',
          text: 'Kéo vạch ‖ ở đầu thanh (số 1) để đổi ngày bắt đầu. Kéo vạch ở cuối thanh (số 2) để đổi ngày xong.',
        },
        status: {
          title: 'Đổi trạng thái thật nhanh',
          text: 'Bấm chuột phải vào thanh. Chọn Chưa làm (số 1), Đang làm hoặc Xong (số 2). Muốn bỏ giai đoạn khỏi lịch thì bấm dòng đỏ (số 3), máy sẽ hỏi lại trước khi xóa.',
        },
        reorder: {
          title: 'Đổi thứ tự dòng',
          text: 'Bấm giữ nút ⋮⋮ ở đầu dòng rồi kéo lên hoặc xuống. Khung nét đứt (số 1) cho biết thả ra sẽ nằm ở đâu.',
        },
        'row-menu': {
          title: 'Chuột phải vào dòng',
          text: 'Chuột phải vào tên một dòng là hiện menu (số 1): mở chi tiết, thêm ghi chú, thêm việc con, đưa lên, đưa xuống hoặc xóa.',
        },
        note: {
          title: 'Ghi chú',
          text: 'Nút ⓘ (số 1) là ghi chú. Đưa chuột vào để đọc nhanh. Bấm vào để đọc hết hoặc sửa.',
        },
        stages: {
          title: 'Sửa các giai đoạn',
          text: 'Bấm bánh răng trên thanh công cụ. Kéo ⋮⋮ (số 1) để đổi thứ tự, sửa tên (số 2), bấm ô màu (số 3) để chọn màu khác. Xong thì bấm Lưu.',
        },
        table: {
          title: 'Chế độ Bảng',
          text: 'Bảng cũng làm được như Biểu đồ. Chuột phải vào một ô ngày (số 1) là hiện menu đổi trạng thái (số 2).',
        },
      },
    },
    design: {
      title: 'Thiết kế màn hình',
      summary: 'Xem từng màn hình, đọc ý nghĩa từng số, góp ý có gắn tên và xóa màn hình.',
      steps: {
        list: {
          title: 'Danh sách màn hình',
          text: 'Mở phần Thiết kế. Mỗi thẻ là một màn hình, ví dụ SC-01. Bấm vào thẻ (số 1) để mở.',
        },
        pins: {
          title: 'Các số trên hình',
          text: 'Trên hình có các chấm số (số 1, số 2). Mỗi chấm chỉ một chỗ trên màn hình. Bấm vào chấm để đọc chỗ đó làm gì.',
        },
        tabs: {
          title: 'Đọc thông tin của một chấm',
          text: 'Bên phải có các thẻ (số 1): thiết kế cơ bản, thiết kế chi tiết, kiểm thử và góp ý. Bấm từng thẻ để xem.',
        },
        comment: {
          title: 'Góp ý và gắn tên',
          text: "Mở thẻ Góp ý, viết vào ô số 1. Gõ {'@'} rồi vài chữ của tên là hiện danh sách người trong dự án (số 2); chọn một người để gắn tên. Bấm Gửi.",
          tip: 'Người được gắn tên sẽ thấy tin ở cái chuông.',
        },
        delete: {
          title: 'Xóa màn hình',
          text: 'Bấm thùng rác đỏ (số 1) trên thẻ màn hình. Máy hỏi lại và nói rõ sẽ mất bao nhiêu số và góp ý.',
          tip: 'Xóa rồi không lấy lại được. Chỉ người được sửa thiết kế mới thấy nút này.',
        },
      },
    },
    members: {
      title: 'Thành viên',
      summary: 'Thêm người vào dự án, đổi vai trò hoặc bỏ người ra.',
      steps: {
        add: {
          title: 'Thêm người vào dự án',
          text: 'Bấm “Thêm thành viên” ở góc trên. Trong hộp hiện ra, gõ tên hoặc email để chọn người (số 1), bấm vào một vai trò (số 2) rồi bấm Thêm.',
          tip: 'Chỉ Quản lý dự án mới thêm hoặc bỏ người được.',
        },
        role: {
          title: 'Đổi vai trò hoặc bỏ ra',
          text: 'Trong danh sách, chọn vai trò mới ở ô số 1. Bấm thùng rác (số 2) để đưa người đó ra khỏi dự án; máy sẽ hỏi lại và cho biết họ đang phụ trách bao nhiêu lịch.',
        },
      },
    },
    languages: {
      title: 'Viết nhiều ngôn ngữ',
      summary: 'Nhập tiếng Việt trước, rồi thêm hoặc dịch sang ngôn ngữ khác.',
      steps: {
        field: {
          title: 'Ô có nút quả địa cầu',
          text: 'Ô chính luôn là tiếng Việt. Nút 🌐 bên cạnh (số 1) mở các ngôn ngữ khác. Số như 1/2 nghĩa là đã nhập 1 trong 2 ngôn ngữ khác.',
        },
        dialog: {
          title: 'Nhập hoặc nhờ máy dịch',
          text: 'Bấm nút 🌐 để mở hộp. Bấm “Dịch các ô còn trống” (số 1) để máy dịch giúp. Đọc lại, sửa nếu cần, rồi bấm Xong (số 2).',
          tip: 'Máy dịch miễn phí và có thể sai. Đừng dịch thông tin bí mật.',
        },
      },
    },
    profile: {
      title: 'Hồ sơ và giao diện',
      summary: 'Đổi màu sáng tối, ngôn ngữ, tên và mật khẩu của bạn.',
      steps: {
        menu: {
          title: 'Menu của bạn',
          text: 'Bấm tên của bạn ở góc trên bên phải. Chọn sáng hoặc tối (số 1), đổi ngôn ngữ (số 2), hoặc mở Hồ sơ (số 3).',
        },
        page: {
          title: 'Trang Hồ sơ',
          text: 'Ở trang Hồ sơ, sửa tên của bạn (số 1) hoặc đổi mật khẩu (số 2), rồi bấm Lưu.',
        },
      },
    },
    admin: {
      title: 'Quản trị',
      summary: 'Tạo người dùng, chia quyền và chọn ngôn ngữ cho cả hệ thống.',
      steps: {
        users: {
          title: 'Người dùng',
          text: 'Mở Cài đặt → Người dùng. Bấm “Tài khoản mới” (số 1) để tạo người dùng. Bấm “Quản lý” (số 2) để sửa, khóa hoặc thêm họ vào dự án.',
        },
        roles: {
          title: 'Vai trò hệ thống',
          text: 'Mở Cài đặt → Phân quyền hệ thống → Vai trò. Mỗi vai trò là một nhóm quyền ngoài phạm vi dự án; tự tạo bao nhiêu cũng được. Tích vào ô (số 1) để cho vai trò đó quyền ấy.',
        },
        'project-roles': {
          title: 'Vai trò trong dự án',
          text: 'Mở Cài đặt → Phân quyền dự án → Vai trò. Bấm “Vai trò mới” (số 1) để tạo vai trò, ví dụ Tech lead. Bấm “Sửa” (số 2) để đổi tên hoặc tick quyền. Thành viên dự án được chọn một trong các vai trò này.',
        },
        permissions: {
          title: 'Quyền',
          text: 'Trang Quyền (trong Phân quyền hệ thống và Phân quyền dự án) liệt kê mọi quyền theo nhóm (số 1). Bấm “Sửa” (số 2) để đổi tên, mô tả, nhóm hoặc thứ tự cho dễ hiểu.',
          tip: 'Quyền không thêm hay xóa được vì mỗi quyền gắn với một chức năng có thật. Vai trò thì tự tạo thoải mái.',
        },
        languages: {
          title: 'Ngôn ngữ',
          text: 'Chọn một ngôn ngữ (số 1) rồi bấm Thêm (số 2), sau đó bấm Lưu. Từ đó mọi ô có nút 🌐 đều có thêm ngôn ngữ này.',
        },
      },
    },
  },
  stepsLabel: 'Các bước của bài này',
};
