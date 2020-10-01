.386
.model flat, stdcall
.data
.code

main PROC
	mov eax, 12
	ret
main ENDP

_start:
	invoke main
	invoke ExitProcess, 0
