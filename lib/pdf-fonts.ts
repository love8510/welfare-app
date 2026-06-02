import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'NanumGothic',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothicBold.ttf',
      fontWeight: 'bold',
    },
  ],
})
