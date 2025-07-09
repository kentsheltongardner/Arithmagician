from sympy.solvers import solve
from sympy import Symbol, solveset, S 
x = Symbol('x')
y = Symbol('y')
# solution = solve(x-y, x)
# print(solution)
solution = solveset(x-x, x, domain = S.Reals)
print(solution)