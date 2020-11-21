int main(){
    int k = 2;
    int m = k ? 3 : 7 * 2;
    int a = 0;
    int b = a*k ? 3 : 7 * 2;
    return b*m;
}