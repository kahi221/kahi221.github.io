# 261009_0012

from datetime import date, timedelta

# 開始日と終了日を指定
start_date = date(2026, 8, 17)
end_date = date(2026, 10, 8)

current_date = start_date
while current_date <= end_date:
    # f文字列で「年-月-日,」のフォーマットを作る（月・日のゼロ埋めなし）
    print(f"{current_date.year}-{current_date.month}-{current_date.day},,")
    current_date += timedelta(days=1)